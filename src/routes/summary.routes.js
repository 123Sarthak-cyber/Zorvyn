import { Router } from "express";
import { db } from "../db/database.js";
import { ROLES } from "../constants/roles.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateQuery } from "../middleware/validate.js";
import { recordFilterSchema } from "../schemas/recordSchemas.js";

const router = Router();

router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER),
  validateQuery(recordFilterSchema),
  (req, res) => {
    const { type, category, search, startDate, endDate } = req.validatedQuery;

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

    const totals = db
      .prepare(
        `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS netBalance
      FROM financial_records
      ${whereClause}
    `
      )
      .get(...params);

    const categoryTotals = db
      .prepare(
        `
      SELECT
        category,
        COALESCE(SUM(amount), 0) AS total,
        COUNT(*) AS recordCount
      FROM financial_records
      ${whereClause}
      GROUP BY category
      ORDER BY total DESC
    `
      )
      .all(...params);

    const recentActivity = db
      .prepare(
        `
      SELECT
        id,
        amount,
        type,
        category,
        entry_date AS date,
        notes,
        created_at AS createdAt
      FROM financial_records
      ${whereClause}
      ORDER BY entry_date DESC, id DESC
      LIMIT 5
    `
      )
      .all(...params);

    const monthlyTrends = db
      .prepare(
        `
      SELECT
        substr(entry_date, 1, 7) AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net
      FROM financial_records
      ${whereClause}
      GROUP BY substr(entry_date, 1, 7)
      ORDER BY month ASC
    `
      )
      .all(...params);

    res.json({
      data: {
        totals,
        categoryTotals,
        recentActivity,
        monthlyTrends
      }
    });
  }
);

export default router;
