import { Router } from "express";
import { db } from "../db/database.js";
import { ROLES } from "../constants/roles.js";
import { HttpError } from "../errors/HttpError.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "../schemas/userSchemas.js";

const router = Router();

router.get("/", requireRole(ROLES.ADMIN), (req, res) => {
  const users = db
    .prepare(`
      SELECT id, name, email, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
      FROM users
      ORDER BY id ASC
    `)
    .all();

  res.json({ data: users });
});

router.post("/", requireRole(ROLES.ADMIN), validateBody(createUserSchema), (req, res, next) => {
  const { name, email, role, isActive = true } = req.validatedBody;

  try {
    const result = db
      .prepare(
        `
      INSERT INTO users (name, email, role, is_active)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(name, email, role, isActive ? 1 : 0);

    const user = db
      .prepare(
        `
      SELECT id, name, email, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
      FROM users
      WHERE id = ?
    `
      )
      .get(result.lastInsertRowid);

    return res.status(201).json({ data: user });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return next(new HttpError(409, "A user with this email already exists"));
    }

    return next(error);
  }
});

router.patch("/:id", requireRole(ROLES.ADMIN), validateBody(updateUserSchema), (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return next(new HttpError(400, "Invalid user id"));
  }

  const currentUser = db.prepare("SELECT id FROM users WHERE id = ?").get(id);

  if (!currentUser) {
    return next(new HttpError(404, "User not found"));
  }

  const updates = [];
  const values = [];
  const { name, email, role, isActive } = req.validatedBody;

  if (name !== undefined) {
    updates.push("name = ?");
    values.push(name);
  }

  if (email !== undefined) {
    updates.push("email = ?");
    values.push(email);
  }

  if (role !== undefined) {
    updates.push("role = ?");
    values.push(role);
  }

  if (isActive !== undefined) {
    updates.push("is_active = ?");
    values.push(isActive ? 1 : 0);
  }

  updates.push("updated_at = datetime('now')");

  try {
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values, id);

    const user = db
      .prepare(
        `
      SELECT id, name, email, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
      FROM users
      WHERE id = ?
    `
      )
      .get(id);

    return res.json({ data: user });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return next(new HttpError(409, "A user with this email already exists"));
    }

    return next(error);
  }
});

export default router;
