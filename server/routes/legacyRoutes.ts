import { Router } from "express";
import type { Request, Response } from "express";

export const legacyRoutes = Router();

const gone = (_req: Request, res: Response) => {
  res.status(410).json({ error: "This endpoint is gone. Use /api/spaces/:spaceSlug/* instead." });
};

legacyRoutes.all("/api/members", gone);
legacyRoutes.all("/api/members/:id", gone);
legacyRoutes.all("/api/branches", gone);
legacyRoutes.all("/api/branches/:id", gone);
legacyRoutes.all("/api/nuclear-families", gone);
legacyRoutes.all("/api/nuclear-families/:id", gone);
legacyRoutes.all("/api/timeline", gone);
legacyRoutes.all("/api/timeline/:id", gone);
legacyRoutes.all("/api/gallery", gone);
legacyRoutes.all("/api/gallery/:id", gone);
