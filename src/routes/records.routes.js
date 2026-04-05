import { Router } from "express";
import { db } from "../db/database.js";
import { ROLES } from "../constants/roles.js";
import { HttpError } from "../errors/HttpError.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createRecordSchema,
  recordFilterSchema,
  updateRecordSchema
} from "../schemas/recordSchemas.js";

const router = Router();

router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER),
  validateQuery(recordFilterSchema),
  (req, res) => {
    const { type, category, search, startDate, endDate, page, pageSize } = req.validatedQuery;

    const conditions = [];
    const params = [];

    conditions.push("deleted_at IS NULL");

    if (type) {
      conditions.push("type = ?");
      params.push(type);
    }

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (search) {
      conditions.push("(lower(category) LIKE lower(?) OR lower(COALESCE(notes, '')) LIKE lower(?))");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (startDate) {
      conditions.push("entry_date >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("entry_date <= ?");
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const countRow = db
      .prepare(`SELECT COUNT(*) AS total FROM financial_records ${whereClause}`)
      .get(...params);

    const records = db
      .prepare(
        `
      SELECT
        fr.id,
        fr.amount,
        fr.type,
        fr.category,
        fr.entry_date AS date,
        fr.notes,
        fr.created_at AS createdAt,
        fr.updated_at AS updatedAt,
        fr.created_by AS createdById,
        u.name AS createdByName
      FROM financial_records fr
      INNER JOIN users u ON u.id = fr.created_by
      ${whereClause}
      ORDER BY fr.entry_date DESC, fr.id DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(...params, pageSize, offset);

    res.json({
      data: records,
      meta: {
        page,
        pageSize,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / pageSize)
      }
    });
  }
);

router.post("/", requireRole(ROLES.ADMIN), validateBody(createRecordSchema), (req, res) => {
  const { amount, type, category, date, notes } = req.validatedBody;

  const result = db
    .prepare(
      `
    INSERT INTO financial_records (amount, type, category, entry_date, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .run(amount, type, category, date, notes ?? null, req.user.id);

  const record = db
    .prepare(
      `
    SELECT
      id,
      amount,
      type,
      category,
      entry_date AS date,
      notes,
      created_by AS createdById,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM financial_records
    WHERE id = ?
  `
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ data: record });
});

router.patch("/:id", requireRole(ROLES.ADMIN), validateBody(updateRecordSchema), (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return next(new HttpError(400, "Invalid record id"));
  }

  const currentRecord = db.prepare("SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL").get(id);

  if (!currentRecord) {
    return next(new HttpError(404, "Record not found"));
  }

  const updates = [];
  const values = [];
  const { amount, type, category, date, notes } = req.validatedBody;

  if (amount !== undefined) {
    updates.push("amount = ?");
    values.push(amount);
  }

  if (type !== undefined) {
    updates.push("type = ?");
    values.push(type);
  }

  if (category !== undefined) {
    updates.push("category = ?");
    values.push(category);
  }

  if (date !== undefined) {
    updates.push("entry_date = ?");
    values.push(date);
  }

  if (notes !== undefined) {
    updates.push("notes = ?");
    values.push(notes ?? null);
  }

  updates.push("updated_at = datetime('now')");

  db.prepare(`UPDATE financial_records SET ${updates.join(", ")} WHERE id = ?`).run(...values, id);

  const record = db
    .prepare(
      `
    SELECT
      id,
      amount,
      type,
      category,
      entry_date AS date,
      notes,
      created_by AS createdById,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM financial_records
    WHERE id = ?
  `
    )
    .get(id);

  return res.json({ data: record });
});

router.delete("/:id", requireRole(ROLES.ADMIN), (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return next(new HttpError(400, "Invalid record id"));
  }

  const result = db
    .prepare("UPDATE financial_records SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL")
    .run(id);

  if (result.changes === 0) {
    return next(new HttpError(404, "Record not found"));
  }

  return res.status(204).send();
});

export default router;
