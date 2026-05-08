import "dotenv/config";
import cors from "cors";
import express from "express";
import type { RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { createRouteHandler } from "uploadthing/express";
import { requireAuth } from "./neonAuth.js";
import {
  getFamilySpaceBySlug,
  loadAppUser,
  requirePlatformAdmin,
  requireSpaceMembership,
  requireSpaceRole,
} from "./authorization.js";
import { prisma } from "./db.js";
import { uploadContentTypes, uploadOptimizedImage, uploadRouter } from "./uploadthing.js";

const app = express();
const distPath = path.resolve(process.cwd(), "dist");
const indexHtmlPath = path.join(distPath, "index.html");

const allowedOrigins = [
  process.env.APP_BASE_URL,
  "https://warisan-ai-558467708906.asia-southeast2.run.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many auth requests. Please try again later." },
});

app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);

app.use("/api", (req, res, next) => {
  const startedAt = performance.now();

  res.on("finish", () => {
    if (process.env.NODE_ENV === "production" && process.env.API_DEBUG !== "1") return;

    const durationMs = Math.round(performance.now() - startedAt);
    const level = durationMs > 1_000 || res.statusCode >= 500 ? "warn" : "info";
    console[level]("[api]", {
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(
  "/api/uploadthing",
  requireAuth,
  createRouteHandler({
    router: uploadRouter,
    config: { token: process.env.UPLOADTHING_TOKEN },
  }),
);

const spaceSlugFromQuery: RequestHandler = (req, _res, next) => {
  if (!req.params.spaceSlug && req.query.spaceSlug) {
    req.params.spaceSlug = String(req.query.spaceSlug);
  }
  next();
};

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
  requireAuth,
  loadAppUser,
  spaceSlugFromQuery,
  requireSpaceMembership,
  express.raw({
    limit: "4mb",
    type: [...uploadContentTypes],
  }),
  async (req, res) => {
    try {
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

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const asNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asRouteParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

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

const mapStory = (story: any) => ({
  id: story.slugId,
  title: story.title,
  content: story.content,
  status: story.status,
  relatedMemberIds: (story.members ?? []).map((link: any) => link.member?.slugId).filter(Boolean),
  sourceNoteIds: (story.sourceNotes ?? []).map((link: any) => link.sourceNote?.slugId).filter(Boolean),
  createdAt: story.createdAt,
  updatedAt: story.updatedAt,
});

const mapSourceNote = (note: any) => ({
  id: note.slugId,
  title: note.title,
  content: note.content,
  type: note.type,
  relatedMemberIds: (note.memberLinks ?? []).map((link: any) => link.member?.slugId).filter(Boolean),
  storyIds: (note.storyLinks ?? []).map((link: any) => link.story?.slugId).filter(Boolean),
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
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

const branchDataFromBody = (branch: any, fallbackId?: string) => ({
  slugId: branch.id || fallbackId,
  name: branch.name ?? "",
  headMemberIds: asStringArray(branch.headMemberIds),
  spouseId: asNullableString(branch.spouseId),
  description: branch.description ?? "",
  summary: asNullableString(branch.summary),
  memberIds: asStringArray(branch.memberIds),
  color: asNullableString(branch.color),
});

const storyDataFromBody = (story: any, fallbackId?: string) => ({
  slugId: story.id || fallbackId,
  title: story.title ?? "",
  content: story.content ?? "",
  status: story.status ?? "draft",
  relatedMemberIds: asStringArray(story.relatedMemberIds),
  sourceNoteIds: asStringArray(story.sourceNoteIds),
});

const sourceNoteDataFromBody = (note: any, fallbackId?: string) => ({
  slugId: note.id || fallbackId,
  title: note.title ?? "",
  content: note.content ?? "",
  type: note.type ?? "note",
  relatedMemberIds: asStringArray(note.relatedMemberIds),
  storyIds: asStringArray(note.storyIds),
});

const mapFamilySpace = (space: any) => ({
  id: space.id,
  slug: space.slug,
  name: space.name,
  description: space.description ?? null,
});

const mapMembership = (membership: any) => ({
  role: membership.role,
  space: mapFamilySpace(membership.familySpace),
});

const mapCurrentMembership = (membership: any, familySpace: any) => ({
  role: membership.role,
  space: mapFamilySpace(membership.familySpace ?? familySpace),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "silsilah-keluarga-api" });
});

app.get("/api/auth/me", requireAuth, loadAppUser, async (req, res) => {
  res.json({ user: req.appUser });
});

app.get("/api/spaces", requireAuth, loadAppUser, async (req, res) => {
  try {
    if (!req.appUser) {
      res.status(500).json({ error: "User context not loaded." });
      return;
    }

    const memberships = await prisma.familyMembership.findMany({
      where: { userId: req.appUser.id },
      include: { familySpace: true },
      orderBy: [{ createdAt: "asc" }],
    });

    res.json(memberships.map(mapMembership));
  } catch (error) {
    handleError(res, error, "Failed to fetch spaces");
  }
});

app.post("/api/spaces", requireAuth, loadAppUser, async (req, res) => {
  try {
    if (!req.appUser) {
      res.status(500).json({ error: "User context not loaded." });
      return;
    }

    const name = asNonEmptyString(req.body?.name);
    if (!name) {
      res.status(400).json({ error: "Space name is required." });
      return;
    }

    const description = asNullableString(req.body?.description);
    const baseSlug = slugify(name) || `space-${Date.now()}`;

    let slug = baseSlug;
    for (let suffix = 2; suffix < 100; suffix += 1) {
      const existing = await prisma.familySpace.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
    }

    const created = await prisma.$transaction(async (tx) => {
      const space = await tx.familySpace.create({
        data: {
          slug,
          name,
          description,
        },
      });

      const membership = await tx.familyMembership.create({
        data: {
          userId: req.appUser!.id,
          familySpaceId: space.id,
          role: "owner",
        },
        include: { familySpace: true },
      });

      return membership;
    });

    res.status(201).json(mapMembership(created));
  } catch (error) {
    handleError(res, error, "Failed to create space");
  }
});

app.get("/api/spaces/:spaceSlug", requireAuth, loadAppUser, requireSpaceMembership, async (req, res) => {
  res.json({
    space: req.familySpace ? mapFamilySpace(req.familySpace) : null,
    membership:
      req.membership && req.familySpace
        ? mapCurrentMembership(req.membership, req.familySpace)
        : null,
  });
});

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

app.get("/api/spaces/:spaceSlug/summary", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const familySpaceId = req.familySpace.id;
    const [
      membersCount,
      generationRows,
      branchesCount,
      nuclearFamiliesCount,
      timelineCount,
      galleryCount,
      storiesCount,
    ] = await prisma.$transaction([
      prisma.familyMember.count({ where: { familySpaceId } }),
      prisma.familyMember.findMany({
        where: { familySpaceId },
        select: { generation: true },
        distinct: ["generation"],
      }),
      prisma.familyBranch.count({ where: { familySpaceId } }),
      prisma.nuclearFamily.count({ where: { familySpaceId } }),
      prisma.timelineEvent.count({ where: { familySpaceId } }),
      prisma.galleryItem.count({ where: { familySpaceId } }),
      prisma.story.count({ where: { familySpaceId } }),
    ]);

    res.json({
      membersCount,
      generationsCount: generationRows.length,
      branchesCount,
      nuclearFamiliesCount,
      timelineCount,
      galleryCount,
      storiesCount,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch space summary");
  }
});

app.patch(
  "/api/spaces/:spaceSlug",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  requireSpaceRole(["owner", "admin"]),
  async (req, res) => {
    try {
      if (!req.familySpace) {
        res.status(500).json({ error: "FamilySpace context not loaded." });
        return;
      }

      const name = asNonEmptyString(req.body?.name);
      const description = req.body && Object.prototype.hasOwnProperty.call(req.body, "description")
        ? asNullableString(req.body.description)
        : undefined;

      const space = await prisma.familySpace.update({
        where: { id: req.familySpace.id },
        data: {
          ...(name ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      });

      res.json({ space: mapFamilySpace(space) });
    } catch (error) {
      handleError(res, error, "Failed to update space");
    }
  },
);

app.get(
  "/api/spaces/:spaceSlug/membership",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  async (req, res) => {
    res.json({
      role: req.membership?.role,
      space: req.familySpace ? mapFamilySpace(req.familySpace) : null,
    });
  },
);

app.get("/api/spaces/:spaceSlug/members", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const members = await prisma.familyMember.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: [{ generation: "asc" }, { fullName: "asc" }],
    });

    res.json(members.map(mapMember));
  } catch (error) {
    handleError(res, error, "Failed to fetch members");
  }
});

app.post("/api/spaces/:spaceSlug/members", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = memberDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Member id is required." });
      return;
    }

    const member = await prisma.familyMember.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.status(201).json(mapMember(member));
  } catch (error) {
    handleError(res, error, "Failed to create member");
  }
});

app.put("/api/spaces/:spaceSlug/members/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const memberId = asRouteParam(req.params.id);
    const data = memberDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Member id is required." });
      return;
    }

    const member = await prisma.familyMember.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: memberId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.json(mapMember(member));
  } catch (error) {
    handleError(res, error, "Failed to update member");
  }
});

app.delete("/api/spaces/:spaceSlug/members/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const memberId = asRouteParam(req.params.id);
    const familySpaceId = req.familySpace.id;

    await prisma.$transaction(async (tx) => {
      const affectedMembers = await tx.familyMember.findMany({
        where: {
          familySpaceId,
          OR: [
            { fatherId: memberId },
            { motherId: memberId },
            { spouseIds: { has: memberId } },
            { formerSpouseIds: { has: memberId } },
            { childrenIds: { has: memberId } },
            { siblingIds: { has: memberId } },
          ],
        },
      });

      await Promise.all(
        affectedMembers.map((member) =>
          tx.familyMember.update({
            where: {
              familySpaceId_slugId: {
                familySpaceId,
                slugId: member.slugId,
              },
            },
            data: {
              fatherId: member.fatherId === memberId ? null : member.fatherId,
              motherId: member.motherId === memberId ? null : member.motherId,
              spouseIds: member.spouseIds.filter((item) => item !== memberId),
              formerSpouseIds: member.formerSpouseIds.filter((item) => item !== memberId),
              childrenIds: member.childrenIds.filter((item) => item !== memberId),
              siblingIds: member.siblingIds.filter((item) => item !== memberId),
            },
          }),
        ),
      );

      await tx.familyMember.deleteMany({
        where: {
          familySpaceId,
          slugId: memberId,
        },
      });
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete member");
  }
});

app.get("/api/spaces/:spaceSlug/branches", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const branches = await prisma.familyBranch.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { name: "asc" },
    });
    res.json(branches.map(mapBranch));
  } catch (error) {
    handleError(res, error, "Failed to fetch branches");
  }
});

app.post("/api/spaces/:spaceSlug/branches", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = branchDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Branch id is required." });
      return;
    }

    const branch = await prisma.familyBranch.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.status(201).json(mapBranch(branch));
  } catch (error) {
    handleError(res, error, "Failed to create branch");
  }
});

app.put("/api/spaces/:spaceSlug/branches/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const branchId = asRouteParam(req.params.id);
    const data = branchDataFromBody(req.body, branchId);
    if (!data.slugId) {
      res.status(400).json({ error: "Branch id is required." });
      return;
    }

    const branch = await prisma.familyBranch.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: branchId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.json(mapBranch(branch));
  } catch (error) {
    handleError(res, error, "Failed to update branch");
  }
});

app.delete("/api/spaces/:spaceSlug/branches/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const branchId = asRouteParam(req.params.id);
    await prisma.familyBranch.deleteMany({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: branchId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete branch");
  }
});

app.get("/api/spaces/:spaceSlug/nuclear-families", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const families = await prisma.nuclearFamily.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { name: "asc" },
    });

    res.json(families.map(mapNuclearFamily));
  } catch (error) {
    handleError(res, error, "Failed to fetch nuclear families");
  }
});

app.get("/api/spaces/:spaceSlug/timeline", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const events = await prisma.timelineEvent.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { year: "asc" },
    });
    res.json(events.map(mapTimelineEvent));
  } catch (error) {
    handleError(res, error, "Failed to fetch timeline events");
  }
});

app.post("/api/spaces/:spaceSlug/timeline", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = timelineDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Timeline event id is required." });
      return;
    }

    const event = await prisma.timelineEvent.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.status(201).json(mapTimelineEvent(event));
  } catch (error) {
    handleError(res, error, "Failed to create timeline event");
  }
});

app.put("/api/spaces/:spaceSlug/timeline/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const eventId = asRouteParam(req.params.id);
    const data = timelineDataFromBody(req.body, eventId);
    if (!data.slugId) {
      res.status(400).json({ error: "Timeline event id is required." });
      return;
    }

    const event = await prisma.timelineEvent.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: eventId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.json(mapTimelineEvent(event));
  } catch (error) {
    handleError(res, error, "Failed to update timeline event");
  }
});

app.delete("/api/spaces/:spaceSlug/timeline/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    await prisma.timelineEvent.deleteMany({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: asRouteParam(req.params.id),
      },
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete timeline event");
  }
});

app.get("/api/spaces/:spaceSlug/gallery", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const items = await prisma.galleryItem.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { year: "asc" },
    });
    res.json(items.map(mapGalleryItem));
  } catch (error) {
    handleError(res, error, "Failed to fetch gallery items");
  }
});

app.post("/api/spaces/:spaceSlug/gallery", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace || !req.appUser) {
      res.status(500).json({ error: "Context not loaded." });
      return;
    }

    const data = galleryDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Gallery item id is required." });
      return;
    }

    const item = await prisma.galleryItem.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
        memberId: asNullableString(req.body?.memberId),
        timelineEventId: asNullableString(req.body?.timelineEventId),
        uploadedById: req.appUser.id,
      },
    });
    res.status(201).json(mapGalleryItem(item));
  } catch (error) {
    handleError(res, error, "Failed to create gallery item");
  }
});

app.put("/api/spaces/:spaceSlug/gallery/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace || !req.appUser) {
      res.status(500).json({ error: "Context not loaded." });
      return;
    }

    const itemId = asRouteParam(req.params.id);
    const data = galleryDataFromBody(req.body, itemId);
    if (!data.slugId) {
      res.status(400).json({ error: "Gallery item id is required." });
      return;
    }

    const item = await prisma.galleryItem.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: itemId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
        memberId: asNullableString(req.body?.memberId),
        timelineEventId: asNullableString(req.body?.timelineEventId),
        uploadedById: req.appUser.id,
      },
    });
    res.json(mapGalleryItem(item));
  } catch (error) {
    handleError(res, error, "Failed to update gallery item");
  }
});

app.delete("/api/spaces/:spaceSlug/gallery/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    await prisma.galleryItem.deleteMany({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: asRouteParam(req.params.id),
      },
    });
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete gallery item");
  }
});

app.get("/api/spaces/:spaceSlug/stories", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const stories = await prisma.story.findMany({
      where: { familySpaceId: req.familySpace.id },
      include: {
        members: { include: { member: true } },
        sourceNotes: { include: { sourceNote: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(stories.map(mapStory));
  } catch (error) {
    handleError(res, error, "Failed to fetch stories");
  }
});

app.post("/api/spaces/:spaceSlug/stories", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = storyDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Story id is required." });
      return;
    }

    const story = await prisma.$transaction(async (tx) => {
      const created = await tx.story.create({
        data: {
          familySpaceId: req.familySpace!.id,
          slugId: data.slugId,
          title: data.title,
          content: data.content,
          status: data.status,
        },
      });

      if (data.relatedMemberIds.length) {
        const relatedMembers = await tx.familyMember.findMany({
          where: {
            familySpaceId: req.familySpace!.id,
            slugId: { in: data.relatedMemberIds },
          },
          select: { id: true },
        });
        if (relatedMembers.length) {
          await tx.storyMember.createMany({
            data: relatedMembers.map((member) => ({
              storyId: created.id,
              memberId: member.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.sourceNoteIds.length) {
        const sourceNotes = await tx.sourceNote.findMany({
          where: {
            familySpaceId: req.familySpace!.id,
            slugId: { in: data.sourceNoteIds },
          },
          select: { id: true },
        });
        if (sourceNotes.length) {
          await tx.storySourceNote.createMany({
            data: sourceNotes.map((note) => ({
              storyId: created.id,
              sourceNoteId: note.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.story.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          members: { include: { member: true } },
          sourceNotes: { include: { sourceNote: true } },
        },
      });
    });

    res.status(201).json(mapStory(story));
  } catch (error) {
    handleError(res, error, "Failed to create story");
  }
});

app.get("/api/spaces/:spaceSlug/source-notes", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const notes = await prisma.sourceNote.findMany({
      where: { familySpaceId: req.familySpace.id },
      include: {
        memberLinks: { include: { member: true } },
        storyLinks: { include: { story: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(notes.map(mapSourceNote));
  } catch (error) {
    handleError(res, error, "Failed to fetch source notes");
  }
});

app.post("/api/spaces/:spaceSlug/source-notes", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = sourceNoteDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Source note id is required." });
      return;
    }

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.sourceNote.create({
        data: {
          familySpaceId: req.familySpace!.id,
          slugId: data.slugId,
          title: data.title,
          content: data.content,
          type: data.type,
        },
      });

      if (data.relatedMemberIds.length) {
        const relatedMembers = await tx.familyMember.findMany({
          where: {
            familySpaceId: req.familySpace!.id,
            slugId: { in: data.relatedMemberIds },
          },
          select: { id: true },
        });
        if (relatedMembers.length) {
          await tx.sourceNoteMember.createMany({
            data: relatedMembers.map((member) => ({
              sourceNoteId: created.id,
              memberId: member.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.storyIds.length) {
        const stories = await tx.story.findMany({
          where: {
            familySpaceId: req.familySpace!.id,
            slugId: { in: data.storyIds },
          },
          select: { id: true },
        });
        if (stories.length) {
          await tx.storySourceNote.createMany({
            data: stories.map((story) => ({
              storyId: story.id,
              sourceNoteId: created.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.sourceNote.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          memberLinks: { include: { member: true } },
          storyLinks: { include: { story: true } },
        },
      });
    });

    res.status(201).json(mapSourceNote(note));
  } catch (error) {
    handleError(res, error, "Failed to create source note");
  }
});

app.get("/api/platform/health", requireAuth, loadAppUser, requirePlatformAdmin, (_req, res) => {
  res.json({ ok: true, service: "warisanai-platform", timestamp: new Date().toISOString() });
});

app.get("/api/platform/stats", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  try {
    const [
      totalUsers,
      totalSpaces,
      totalMembers,
      totalGalleryItems,
      totalTimelineEvents,
      totalStories,
      totalSourceNotes,
    ] = await Promise.all([
      prisma.appUser.count(),
      prisma.familySpace.count(),
      prisma.familyMember.count(),
      prisma.galleryItem.count(),
      prisma.timelineEvent.count(),
      prisma.story.count(),
      prisma.sourceNote.count(),
    ]);

    res.json({
      totalUsers,
      totalSpaces,
      totalMembers,
      totalGalleryItems,
      totalTimelineEvents,
      totalStories,
      totalSourceNotes,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch platform stats");
  }
});

app.get("/api/platform/spaces", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  try {
    const spaces = await prisma.familySpace.findMany({
      include: {
        _count: {
          select: {
            members: true,
            timelineEvents: true,
            galleryItems: true,
          },
        },
        memberships: {
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      spaces.map((space) => ({
        id: space.id,
        slug: space.slug,
        name: space.name,
        ownerCount: space.memberships.filter((membership) => membership.role === "owner").length,
        memberCount: space.memberships.length,
        recordCounts: {
          members: space._count.members,
          timeline: space._count.timelineEvents,
          gallery: space._count.galleryItems,
        },
        createdAt: space.createdAt,
      })),
    );
  } catch (error) {
    handleError(res, error, "Failed to fetch platform spaces");
  }
});

app.get("/api/platform/users", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  try {
    const users = await prisma.appUser.findMany({
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        spacesCount: user._count.memberships,
        createdAt: user.createdAt,
      })),
    );
  } catch (error) {
    handleError(res, error, "Failed to fetch platform users");
  }
});

app.get("/api/platform/system", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  let databaseConnected = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseConnected = false;
  }

  res.json({
    apiHealth: true,
    databaseConnected,
    uploadThingConfigured: Boolean(process.env.UPLOADTHING_TOKEN),
    neonAuthConfigured: Boolean(process.env.VITE_NEON_AUTH_URL),
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    uptime: Math.round(process.uptime()),
  });
});

const gone = (_req: express.Request, res: Response) => {
  res.status(410).json({ error: "This endpoint is gone. Use /api/spaces/:spaceSlug/* instead." });
};

app.all("/api/members", gone);
app.all("/api/members/:id", gone);
app.all("/api/branches", gone);
app.all("/api/branches/:id", gone);
app.all("/api/nuclear-families", gone);
app.all("/api/nuclear-families/:id", gone);
app.all("/api/timeline", gone);
app.all("/api/timeline/:id", gone);
app.all("/api/gallery", gone);
app.all("/api/gallery/:id", gone);

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
