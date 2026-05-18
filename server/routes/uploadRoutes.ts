import express, { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { handleError } from "../http/error.js";
import { spaceSlugFromQuery } from "../middlewares/spaceSlugFromQuery.js";
import { userRateLimit } from "../middlewares/userRateLimit.js";
import { requireAuth } from "../neonAuth.js";
import { safeFilename } from "./shared.js";
import { uploadContentTypes, uploadOptimizedImage } from "../uploadthing.js";

export const uploadRoutes = Router();

const rawImageBody = express.raw({
  limit: "4mb",
  type: [...uploadContentTypes],
});

const uploadLimiter = userRateLimit({
  windowMs: 60_000,
  limit: 12,
  message: { error: "Too many upload attempts. Please try again later." },
});

const validateImageUpload = (req: express.Request, res: express.Response) => {
  const contentType = req.headers["content-type"]?.split(";")[0];
  if (!contentType || !uploadContentTypes.includes(contentType as (typeof uploadContentTypes)[number])) {
    res.status(415).json({ error: "Only JPEG, PNG, and WebP images are supported." });
    return false;
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    res.status(400).json({ error: "No image file received." });
    return false;
  }

  return true;
};

uploadRoutes.post(
  "/api/uploads/photos",
  requireAuth,
  loadAppUser,
  spaceSlugFromQuery,
  requireSpaceMembership,
  requireSpaceRole(["owner", "admin"]),
  uploadLimiter,
  rawImageBody,
  async (req, res) => {
    try {
      const folder = String(req.query.folder ?? "");
      if (folder !== "members" && folder !== "gallery") {
        res.status(400).json({ error: "Invalid upload folder. Use members or gallery." });
        return;
      }

      if (!validateImageUpload(req, res)) return;

      const filename = safeFilename(String(req.query.filename ?? "photo"));
      const upload = await uploadOptimizedImage({
        body: req.body,
        filename,
        folder,
      });

      res.json(upload);
    } catch (error) {
      handleError(res, error, "Failed to upload image");
    }
  },
);

uploadRoutes.post(
  "/api/uploads/avatar",
  requireAuth,
  loadAppUser,
  uploadLimiter,
  rawImageBody,
  async (req, res) => {
    try {
      if (!validateImageUpload(req, res)) return;

      const filename = safeFilename(String(req.query.filename ?? "avatar"));
      const upload = await uploadOptimizedImage({
        body: req.body,
        filename,
        folder: "avatars",
      });

      res.json(upload);
    } catch (error) {
      handleError(res, error, "Failed to upload avatar");
    }
  },
);
