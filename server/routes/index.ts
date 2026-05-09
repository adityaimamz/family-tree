import type { Express } from "express";
import { aiRoutes } from "./aiRoutes.js";
import { branchRoutes } from "./branchRoutes.js";
import { galleryRoutes } from "./galleryRoutes.js";
import { legacyRoutes } from "./legacyRoutes.js";
import { memberRoutes } from "./memberRoutes.js";
import { nuclearFamilyRoutes } from "./nuclearFamilyRoutes.js";
import { platformRoutes } from "./platformRoutes.js";
import { sourceNoteRoutes } from "./sourceNoteRoutes.js";
import { spaceRoutes } from "./spaceRoutes.js";
import { storyRoutes } from "./storyRoutes.js";
import { timelineRoutes } from "./timelineRoutes.js";
import { uploadRoutes } from "./uploadRoutes.js";

export const registerRoutes = (app: Express) => {
  app.use(uploadRoutes);
  app.use(spaceRoutes);
  app.use(memberRoutes);
  app.use(branchRoutes);
  app.use(nuclearFamilyRoutes);
  app.use(timelineRoutes);
  app.use(galleryRoutes);
  app.use(storyRoutes);
  app.use(sourceNoteRoutes);
  app.use(aiRoutes);
  app.use(platformRoutes);
  app.use(legacyRoutes);
};
