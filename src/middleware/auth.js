import { db } from "../db/database.js";
import { HttpError } from "../errors/HttpError.js";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "dev-secret";

function findUserById(userId) {
  return db
    .prepare(
      `
    SELECT id, name, email, role, is_active AS isActive
    FROM users
    WHERE id = ?
  `
    )
    .get(userId);
}

export function issueAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    {
      expiresIn: "8h"
    }
  );
}

export function authenticate(req, _res, next) {
  const authorizationHeader = req.header("authorization");

  if (authorizationHeader?.startsWith("Bearer ")) {
    const token = authorizationHeader.slice(7);

    try {
      const payload = jwt.verify(token, jwtSecret);
      const user = findUserById(Number(payload.sub));

      if (!user) {
        return next(new HttpError(401, "User not found"));
      }

      if (!user.isActive) {
        return next(new HttpError(403, "Inactive users cannot access the API"));
      }

      req.user = user;
      req.authType = "token";
      return next();
    } catch (_error) {
      return next(new HttpError(401, "Invalid or expired token"));
    }
  }

  const userIdHeader = req.header("x-user-id");

  if (!userIdHeader) {
    return next(new HttpError(401, "Missing authorization token or x-user-id header"));
  }

  const userId = Number(userIdHeader);

  if (!Number.isInteger(userId) || userId <= 0) {
    return next(new HttpError(401, "Invalid x-user-id header"));
  }

  const user = findUserById(userId);

  if (!user) {
    return next(new HttpError(401, "User not found"));
  }

  if (!user.isActive) {
    return next(new HttpError(403, "Inactive users cannot access the API"));
  }

  req.user = user;
  req.authType = "header";
  return next();
}
