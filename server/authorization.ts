import type { RequestHandler } from "express";
import type { AppUser, FamilyMembership, FamilyRole, FamilySpace } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";

declare global {
  namespace Express {
    interface Request {
      appUser?: AppUser;
      familySpace?: FamilySpace;
      membership?: FamilyMembership;
    }
  }
}

const forbidden = (res: Parameters<RequestHandler>[1], message: string) => {
  res.status(403).json({ error: message });
};

const unauthorized = (res: Parameters<RequestHandler>[1], message: string) => {
  res.status(401).json({ error: message });
};

const shouldLogAuthzDebug = () => process.env.NODE_ENV !== "production" && process.env.AUTH_DEBUG !== "0";

const authzLog = (event: string, data: Record<string, unknown>, level: "info" | "warn" = "info") => {
  if (level === "info" && !shouldLogAuthzDebug()) return;
  console[level](`[authz] ${event}`, data);
};

const isMissingMembershipProfileColumnError = (error: unknown) => {
  const maybeError = error as { code?: unknown; message?: unknown; meta?: { code?: unknown; message?: unknown } } | null;
  return (
    maybeError?.code === "P2010" &&
    (maybeError.meta?.code === "42703" ||
      String(maybeError.message ?? "").includes("displayName") ||
      String(maybeError.meta?.message ?? "").includes("displayName"))
  );
};

export const loadAppUser: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    unauthorized(res, "Authentication required.");
    return;
  }

  const email = req.user.email?.trim().toLowerCase();
  if (!email) {
    unauthorized(res, "Authentication required.");
    return;
  }

  try {
    console.log("[debug] loadAppUser: fetching byAuthId for", req.user.id);
    const byAuthId = await prisma.appUser.findUnique({ where: { authUserId: req.user.id } });
    console.log("[debug] loadAppUser: byAuthId result", !!byAuthId);

    const byEmail = byAuthId ? null : await prisma.appUser.findUnique({ where: { email } });
    if (!byAuthId) console.log("[debug] loadAppUser: byEmail result", !!byEmail);


    const appUser = await (async () => {
      if (byAuthId) {
        console.log("[debug] loadAppUser: checking changes for byAuthId");
        const emailChanged = byAuthId.email !== email;
        const nameChanged = req.user?.name && byAuthId.name !== req.user.name;

        if (!emailChanged && !nameChanged) {
          console.log("[debug] loadAppUser: no changes, returning byAuthId");
          return byAuthId;
        }

        console.log("[debug] loadAppUser: updating byAuthId", { emailChanged, nameChanged });
        return prisma.appUser.update({
          where: { id: byAuthId.id },
          data: {
            ...(emailChanged ? { email } : {}),
            ...(nameChanged ? { name: req.user!.name } : {}),
          },
        });
      }

      if (byEmail) {
        console.log("[debug] loadAppUser: linking byEmail");
        const nameChanged = req.user?.name && byEmail.name !== req.user.name;
        const authIdChanged = byEmail.authUserId !== req.user!.id;

        if (!nameChanged && !authIdChanged) return byEmail;

        return prisma.appUser.update({
          where: { id: byEmail.id },
          data: {
            authUserId: req.user!.id,
            ...(nameChanged ? { name: req.user!.name } : {}),
          },
        });
      }

      console.log("[debug] loadAppUser: creating new user");
      return prisma.appUser.create({
        data: {
          authUserId: req.user!.id,
          email,
          name: req.user?.name ?? undefined,
        },
      });
    })();
    console.log("[debug] loadAppUser: success, appUserId", appUser.id);


    req.appUser = appUser;
    authzLog("app_user_loaded", {
      method: req.method,
      path: req.originalUrl || req.path,
      authUserId: req.user.id,
      appUserId: appUser.id,
      email: appUser.email,
      platformRole: appUser.platformRole,
    });
    next();
  } catch (error) {
    console.error("Failed to load AppUser", error);
    res.status(500).json({ error: "Failed to load user." });
  }
};

export const requirePlatformAdmin: RequestHandler = (req, res, next) => {
  if (!req.appUser) {
    res.status(500).json({ error: "User context not loaded." });
    return;
  }

  if (req.appUser.platformRole !== "platform_admin") {
    authzLog("platform_admin_denied", {
      method: req.method,
      path: req.originalUrl || req.path,
      appUserId: req.appUser.id,
      email: req.appUser.email,
      platformRole: req.appUser.platformRole,
    }, "warn");
    forbidden(res, "Platform admin role required.");
    return;
  }

  authzLog("platform_admin_allowed", {
    method: req.method,
    path: req.originalUrl || req.path,
    appUserId: req.appUser.id,
    email: req.appUser.email,
    platformRole: req.appUser.platformRole,
  });
  next();
};

export const getFamilySpaceBySlug = async (spaceSlug: string, userId: string) => {
  const familySpace = await prisma.familySpace.findUnique({ where: { slug: spaceSlug } });
  if (!familySpace) return { familySpace: null, membership: null } as const;

  const membership = await prisma.familyMembership.findUnique({
    where: {
      userId_familySpaceId: {
        userId,
        familySpaceId: familySpace.id,
      },
    },
  });

  if (!membership) return { familySpace, membership: null } as const;

  const profile = await (async () => {
    try {
      const [row] = await prisma.$queryRaw<Array<{ displayName: string | null; avatarUrl: string | null }>>(
        Prisma.sql`
          SELECT "displayName", "avatarUrl"
          FROM "FamilyMembership"
          WHERE "id" = ${membership.id}
          LIMIT 1
        `,
      );
      return row;
    } catch (error) {
      if (isMissingMembershipProfileColumnError(error)) {
        authzLog("membership_profile_columns_missing", { spaceSlug, membershipId: membership.id }, "warn");
        return null;
      }
      throw error;
    }
  })();

  return {
    familySpace,
    membership: {
      ...membership,
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    } as FamilyMembership,
  } as const;
};

export const requireSpaceMembership: RequestHandler = async (req, res, next) => {
  if (!req.appUser) {
    res.status(500).json({ error: "User context not loaded." });
    return;
  }

  const spaceSlug = String(req.params.spaceSlug ?? "");
  if (!spaceSlug) {
    res.status(400).json({ error: "Missing spaceSlug." });
    return;
  }

  try {
    const { familySpace, membership } = await getFamilySpaceBySlug(spaceSlug, req.appUser.id);

    if (!familySpace) {
      res.status(404).json({ error: "FamilySpace not found." });
      return;
    }

    if (!membership) {
      authzLog("space_membership_denied", {
        method: req.method,
        path: req.originalUrl || req.path,
        appUserId: req.appUser.id,
        email: req.appUser.email,
        spaceSlug,
      }, "warn");
      forbidden(res, "FamilySpace membership required.");
      return;
    }

    req.familySpace = familySpace;
    req.membership = membership;
    authzLog("space_membership_allowed", {
      method: req.method,
      path: req.originalUrl || req.path,
      appUserId: req.appUser.id,
      email: req.appUser.email,
      spaceSlug,
      familySpaceId: familySpace.id,
      role: membership.role,
    });
    next();
  } catch (error) {
    console.error("Failed to load FamilySpace membership", error);
    res.status(500).json({ error: "Failed to load membership." });
  }
};

export const requireSpaceRole = (allowedRoles: FamilyRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.membership) {
      res.status(500).json({ error: "Membership context not loaded." });
      return;
    }

    if (!allowedRoles.includes(req.membership.role)) {
      forbidden(res, "Insufficient space role.");
      return;
    }

    next();
  };
};
