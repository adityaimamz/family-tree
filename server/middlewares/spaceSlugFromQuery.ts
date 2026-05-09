import type { RequestHandler } from "express";

export const spaceSlugFromQuery: RequestHandler = (req, _res, next) => {
  const querySlug = req.query.spaceSlug;
  if (!req.params.spaceSlug && querySlug) {
    if (typeof querySlug === "string") {
      req.params.spaceSlug = querySlug;
    } else if (Array.isArray(querySlug) && typeof querySlug[0] === "string") {
      req.params.spaceSlug = querySlug[0];
    }
  }
  next();
};
