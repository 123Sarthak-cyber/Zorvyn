import { Router } from "express";
import { z } from "zod";
import { db } from "../db/database.js";
import { HttpError } from "../errors/HttpError.js";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { issueAuthToken } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().email()
});

router.post("/login", validateBody(loginSchema), (req, res, next) => {
  const { email } = req.validatedBody;

  const user = db
    .prepare(
      `
    SELECT id, name, email, role, is_active AS isActive
    FROM users
    WHERE lower(email) = lower(?)
  `
    )
    .get(email);

  if (!user) {
    return next(new HttpError(404, "User not found"));
  }

  if (!user.isActive) {
    return next(new HttpError(403, "Inactive users cannot log in"));
  }

  const token = issueAuthToken(user);

  return res.json({
    data: {
      token,
      tokenType: "Bearer",
      user
    }
  });
});

router.get("/me", authenticate, (req, res) => {
  return res.json({ data: req.user });
});

export default router;