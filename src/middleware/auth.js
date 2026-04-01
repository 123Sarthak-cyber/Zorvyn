import { db } from "../db/database.js";
import { HttpError } from "../errors/HttpError.js";

export function mockAuth(req, _res, next) {
  const userIdHeader = req.header("x-user-id");

  if (!userIdHeader) {
    return next(new HttpError(401, "Missing x-user-id header"));
  }

  const userId = Number(userIdHeader);

  if (!Number.isInteger(userId) || userId <= 0) {
    return next(new HttpError(401, "Invalid x-user-id header"));
  }

  const user = db
    .prepare(
      `
    SELECT id, name, email, role, is_active AS isActive
    FROM users
    WHERE id = ?
  `
    )
    .get(userId);

  if (!user) {
    return next(new HttpError(401, "User not found"));
  }

  if (!user.isActive) {
    return next(new HttpError(403, "Inactive users cannot access the API"));
  }

  req.user = user;
  return next();
}
