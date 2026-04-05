import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { before } from "node:test";
import request from "supertest";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zorvyn-test-"));
const dbPath = path.join(tempDir, "test.db");

process.env.FINANCE_DB_PATH = dbPath;
process.env.JWT_SECRET = "test-secret";
process.env.AUTH_RATE_LIMIT_MAX = "5";
process.env.API_RATE_LIMIT_MAX = "100";

const { default: app } = await import("../src/app.js");
const { initDatabase, db } = await import("../src/db/database.js");

initDatabase();

const tokens = {};

before(async () => {
  const adminLogin = await request(app).post("/api/auth/login").send({ email: "admin@finance.local" });
  const analystLogin = await request(app).post("/api/auth/login").send({ email: "analyst@finance.local" });
  const viewerLogin = await request(app).post("/api/auth/login").send({ email: "viewer@finance.local" });

  assert.equal(adminLogin.status, 200);
  assert.equal(analystLogin.status, 200);
  assert.equal(viewerLogin.status, 200);

  tokens.admin = adminLogin.body.data.token;
  tokens.analyst = analystLogin.body.data.token;
  tokens.viewer = viewerLogin.body.data.token;
});

test.after(() => {
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function login(email) {
  const response = await request(app).post("/api/auth/login").send({ email });
  assert.equal(response.status, 200);
  return response.body.data.token;
}

test("auth login returns JWT token", async () => {
  assert.ok(tokens.admin);
});

test("records support search and soft delete", async () => {
  const token = tokens.admin;

  const created = await request(app)
    .post("/api/records")
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 2500,
      type: "income",
      category: "salary",
      date: "2026-04-01",
      notes: "April payroll"
    });

  assert.equal(created.status, 201);

  const search = await request(app)
    .get("/api/records?search=payroll")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(search.status, 200);
  assert.equal(search.body.meta.total, 1);

  const deleteResult = await request(app)
    .delete(`/api/records/${created.body.data.id}`)
    .set("Authorization", `Bearer ${token}`);

  assert.equal(deleteResult.status, 204);

  const afterDelete = await request(app)
    .get("/api/records?search=payroll")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(afterDelete.status, 200);
  assert.equal(afterDelete.body.meta.total, 0);
});

test("token auth is accepted on protected routes", async () => {
  const token = tokens.analyst;

  const response = await request(app)
    .get("/api/summary")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.ok(response.body.data);
});

test("auth rate limiting is enforced", async () => {
  const first = await request(app).post("/api/auth/login").send({ email: "viewer@finance.local" });
  const second = await request(app).post("/api/auth/login").send({ email: "viewer@finance.local" });
  const third = await request(app).post("/api/auth/login").send({ email: "viewer@finance.local" });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(third.status, 429);
});