import "dotenv/config";
import { put } from "@vercel/blob";
import cors from "cors";
import express from "express";
import type { Response } from "express";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import sharp from "sharp";
import ws from "ws";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured. Add it to the environment before starting the backend.");
}

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });
const app = express();
const uploadContentTypes = ["image/jpeg", "image/png", "image/webp"];
const distPath = path.resolve(process.cwd(), "dist");
const indexHtmlPath = path.join(distPath, "index.html");

app.use(cors());

const safeFilename = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72) || "photo";

app.post(
  "/api/uploads/photos",
  express.raw({
    limit: "4mb",
    type: uploadContentTypes,
  }),
  async (req, res) => {
    try {
      console.log("Checking BLOB_READ_WRITE_TOKEN...", { 
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 10) 
      });

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN is not configured." });
        return;
      }

      const folder = String(req.query.folder ?? "");
      if (folder !== "members" && folder !== "gallery") {
        res.status(400).json({ error: "Invalid upload folder. Use members or gallery." });
        return;
      }

      const contentType = req.headers["content-type"]?.split(";")[0];
      if (!contentType || !uploadContentTypes.includes(contentType as (typeof uploadContentTypes)[number])) {
        res.status(415).json({ error: "Only JPEG, PNG, and WebP images are supported." });
        return;
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: "No image file received." });
        return;
      }

      const filename = safeFilename(String(req.query.filename ?? "photo"));
      const webp = await sharp(req.body)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const blob = await put(`${folder}/${Date.now()}-${filename}.webp`, webp, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
      });

      res.json({
        url: blob.url,
        pathname: blob.pathname,
        contentType: "image/webp",
        size: webp.length,
      });
    } catch (error) {
      handleError(res, error, "Failed to upload image");
    }
  },
);

app.use(express.json({ limit: "2mb" }));

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const asNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  res.status(500).json({ error: message });
};

const mapMember = (member: any) => ({
  id: member.slugId,
  fullName: member.fullName,
  displayName: member.displayName,
  gender: member.gender,
  generation: member.generation,
  familyBranch: member.familyBranchId,
  fatherId: member.fatherId,
  motherId: member.motherId,
  spouseIds: member.spouseIds ?? [],
  formerSpouseIds: member.formerSpouseIds ?? [],
  childrenIds: member.childrenIds ?? [],
  siblingIds: member.siblingIds ?? [],
  parentFamilyId: member.parentFamilyId,
  nuclearFamilyIds: member.nuclearFamilyIds ?? [],
  birthDate: member.birthDate,
  marriageDate: member.marriageDate,
  deathDate: member.deathDate,
  isDeceased: member.isDeceased,
  deceasedLabel: member.deceasedLabel,
  birthPlace: member.birthPlace,
  biography: member.biography,
  notes: member.notes,
  photo: member.photo,
  statusLabel: member.statusLabel,
  relationshipToRoot: member.relationshipToRoot,
});

const mapBranch = (branch: any) => ({
  id: branch.slugId,
  name: branch.name,
  headMemberIds: branch.headMemberIds ?? [],
  spouseId: branch.spouseId,
  description: branch.description,
  summary: branch.summary,
  memberIds: branch.memberIds ?? [],
  color: branch.color,
});

const mapNuclearFamily = (family: any) => ({
  id: family.slugId,
  name: family.name,
  parentIds: family.parentIds ?? [],
  childrenIds: family.childrenIds ?? [],
  branchId: family.branchId,
  summary: family.summary,
});

const mapTimelineEvent = (event: any) => ({
  id: event.slugId,
  year: event.year,
  type: event.type,
  title: event.title,
  description: event.description,
  relatedMemberIds: event.relatedMemberIds ?? [],
  memberIds: event.memberIds ?? [],
  photo: event.photo,
  isAutomatic: event.isAutomatic,
});

const mapGalleryItem = (item: any) => ({
  id: item.slugId,
  title: item.title,
  date: item.date,
  year: item.year,
  event: item.event,
  familyGroup: item.familyGroup,
  description: item.description,
  image: item.image,
});

const timelineDataFromBody = (event: any, fallbackId?: string) => ({
  slugId: event.id || fallbackId,
  year: event.year ?? "",
  type: event.type ?? "Peristiwa Penting",
  title: event.title ?? "",
  description: event.description ?? "",
  relatedMemberIds: asStringArray(event.relatedMemberIds),
  memberIds: asStringArray(event.memberIds),
  photo: asNullableString(event.photo),
  isAutomatic: Boolean(event.isAutomatic),
});

const galleryDataFromBody = (item: any, fallbackId?: string) => ({
  slugId: item.id || fallbackId,
  title: item.title ?? "",
  date: item.date ?? "",
  year: item.year ?? "",
  event: asNullableString(item.event),
  familyGroup: item.familyGroup ?? "",
  description: item.description ?? "",
  image: item.image ?? "",
});

const memberDataFromBody = (member: any) => ({
  slugId: member.id,
  fullName: member.fullName ?? "",
  displayName: member.displayName ?? member.fullName ?? "",
  gender: member.gender ?? "unknown",
  generation: Number(member.generation ?? 0),
  familyBranchId: member.familyBranch,
  fatherId: asNullableString(member.fatherId),
  motherId: asNullableString(member.motherId),
  spouseIds: asStringArray(member.spouseIds),
  formerSpouseIds: asStringArray(member.formerSpouseIds),
  childrenIds: asStringArray(member.childrenIds),
  siblingIds: asStringArray(member.siblingIds),
  parentFamilyId: asNullableString(member.parentFamilyId),
  nuclearFamilyIds: asStringArray(member.nuclearFamilyIds),
  birthDate: asNullableString(member.birthDate),
  marriageDate: asNullableString(member.marriageDate),
  deathDate: asNullableString(member.deathDate),
  isDeceased: Boolean(member.isDeceased),
  deceasedLabel: asNullableString(member.deceasedLabel),
  birthPlace: asNullableString(member.birthPlace),
  biography: member.biography ?? "",
  notes: member.notes ?? "",
  photo: asNullableString(member.photo),
  statusLabel: member.statusLabel ?? "",
  relationshipToRoot: member.relationshipToRoot ?? "",
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "silsilah-keluarga-api" });
});

app.get("/api/members", async (_req, res) => {
  try {
    const members = await prisma.familyMember.findMany({
      orderBy: [{ generation: "asc" }, { fullName: "asc" }],
    });
    res.json(members.map(mapMember));
  } catch (error) {
    handleError(res, error, "Failed to fetch members");
  }
});

app.post("/api/members", async (req, res) => {
  try {
    const member = await prisma.familyMember.create({
      data: memberDataFromBody(req.body),
    });
    res.status(201).json(mapMember(member));
  } catch (error) {
    handleError(res, error, "Failed to create member");
  }
});

app.put("/api/members/:id", async (req, res) => {
  try {
    const member = await prisma.familyMember.update({
      where: { slugId: req.params.id },
      data: memberDataFromBody(req.body),
    });
    res.json(mapMember(member));
  } catch (error) {
    handleError(res, error, "Failed to update member");
  }
});

app.delete("/api/members/:id", async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const affectedMembers = await tx.familyMember.findMany({
        where: {
          OR: [
            { fatherId: req.params.id },
            { motherId: req.params.id },
            { spouseIds: { has: req.params.id } },
            { formerSpouseIds: { has: req.params.id } },
            { childrenIds: { has: req.params.id } },
            { siblingIds: { has: req.params.id } },
          ],
        },
      });

      await Promise.all(
        affectedMembers.map((member) =>
          tx.familyMember.update({
            where: { slugId: member.slugId },
            data: {
              fatherId: member.fatherId === req.params.id ? null : member.fatherId,
              motherId: member.motherId === req.params.id ? null : member.motherId,
              spouseIds: member.spouseIds.filter((item) => item !== req.params.id),
              formerSpouseIds: member.formerSpouseIds.filter((item) => item !== req.params.id),
              childrenIds: member.childrenIds.filter((item) => item !== req.params.id),
              siblingIds: member.siblingIds.filter((item) => item !== req.params.id),
            },
          }),
        ),
      );

      await tx.familyMember.deleteMany({ where: { slugId: req.params.id } });
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete member");
  }
});

app.get("/api/branches", async (_req, res) => {
  try {
    const branches = await prisma.familyBranch.findMany({ orderBy: { name: "asc" } });
    res.json(branches.map(mapBranch));
  } catch (error) {
    handleError(res, error, "Failed to fetch branches");
  }
});

app.get("/api/nuclear-families", async (_req, res) => {
  try {
    const families = await prisma.nuclearFamily.findMany({ orderBy: { name: "asc" } });
    res.json(families.map(mapNuclearFamily));
  } catch (error) {
    handleError(res, error, "Failed to fetch nuclear families");
  }
});

app.get("/api/timeline", async (_req, res) => {
  try {
    const events = await prisma.timelineEvent.findMany({ orderBy: { year: "asc" } });
    res.json(events.map(mapTimelineEvent));
  } catch (error) {
    handleError(res, error, "Failed to fetch timeline events");
  }
});

app.post("/api/timeline", async (req, res) => {
  try {
    const event = await prisma.timelineEvent.create({
      data: timelineDataFromBody(req.body),
    });
    res.status(201).json(mapTimelineEvent(event));
  } catch (error) {
    handleError(res, error, "Failed to create timeline event");
  }
});

app.put("/api/timeline/:id", async (req, res) => {
  try {
    const event = await prisma.timelineEvent.update({
      where: { slugId: req.params.id },
      data: timelineDataFromBody(req.body, req.params.id),
    });
    res.json(mapTimelineEvent(event));
  } catch (error) {
    handleError(res, error, "Failed to update timeline event");
  }
});

app.delete("/api/timeline/:id", async (req, res) => {
  try {
    await prisma.timelineEvent.deleteMany({ where: { slugId: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete timeline event");
  }
});

app.get("/api/gallery", async (_req, res) => {
  try {
    const items = await prisma.galleryItem.findMany({ orderBy: { year: "asc" } });
    res.json(items.map(mapGalleryItem));
  } catch (error) {
    handleError(res, error, "Failed to fetch gallery items");
  }
});

app.post("/api/gallery", async (req, res) => {
  try {
    const item = await prisma.galleryItem.create({
      data: galleryDataFromBody(req.body),
    });
    res.status(201).json(mapGalleryItem(item));
  } catch (error) {
    handleError(res, error, "Failed to create gallery item");
  }
});

app.put("/api/gallery/:id", async (req, res) => {
  try {
    const item = await prisma.galleryItem.update({
      where: { slugId: req.params.id },
      data: galleryDataFromBody(req.body, req.params.id),
    });
    res.json(mapGalleryItem(item));
  } catch (error) {
    handleError(res, error, "Failed to update gallery item");
  }
});

app.delete("/api/gallery/:id", async (req, res) => {
  try {
    await prisma.galleryItem.deleteMany({ where: { slugId: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete gallery item");
  }
});

app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path === "/api" || req.path.startsWith("/api/")) {
    next();
    return;
  }

  res.sendFile(indexHtmlPath);
});

export { prisma };
export default app;
