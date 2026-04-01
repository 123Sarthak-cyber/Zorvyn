import { HttpError } from "../errors/HttpError.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new HttpError(400, "Validation failed", {
          issues: result.error.issues
        })
      );
    }

    req.validatedBody = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return next(
        new HttpError(400, "Invalid query parameters", {
          issues: result.error.issues
        })
      );
    }

    req.validatedQuery = result.data;
    return next();
  };
}
