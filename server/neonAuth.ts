import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "./db.js";
import { safeRequestPath } from "./security.js";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksUrl: string | null = null;

const shouldLogAuthDebug = () => process.env.NODE_ENV !== "production" && process.env.AUTH_DEBUG !== "0";

const authLog = (event: string, data: Record<string, unknown>, level: "info" | "warn" | "error" = "info") => {
  if (level === "info" && !shouldLogAuthDebug()) return;
  console[level](`[auth] ${event}`, data);
};

const getNeonAuthUrl = () => {
  const authUrl = process.env.VITE_NEON_AUTH_URL;
  if (!authUrl) {
    throw new Error("VITE_NEON_AUTH_URL is not configured.");
  }
  return authUrl.endsWith("/") ? authUrl : `${authUrl}/`;
};

const getJwksUrl = () => new URL(".well-known/jwks.json", getNeonAuthUrl()).toString();

const getJwks = () => {
  if (!jwks) {
    jwksUrl = getJwksUrl();
    authLog("jwks_configured", { jwksUrl });
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return jwks;
};

export const resetAuthJwksForTests = () => {
  if (process.env.NODE_ENV !== "test") return;
  jwks = null;
  jwksUrl = null;
};

const bearerTokenFrom = (req: Request) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
};

const stringClaim = (payload: JWTPayload, key: string) => {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const requestContext = (req: Request) => ({
  requestId: typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"] : randomUUID(),
  method: req.method,
  path: safeRequestPath(req),
});

const isJwtLike = (token: string) => token.split(".").length === 3;

const tokenShape = (token: string | null) => ({
  present: Boolean(token),
  length: token?.length ?? 0,
  segments: token ? token.split(".").length : 0,
});

const jwtHeaderSummary = (token: string) => {
  try {
    const header = decodeProtectedHeader(token);
    return {
      alg: header.alg,
      kid: header.kid,
      typ: header.typ,
    };
  } catch {
    return null;
  }
};

const jwtPayloadSummary = (token: string) => {
  try {
    const payload = decodeJwt(token);
    const exp = typeof payload.exp === "number" ? new Date(payload.exp * 1000).toISOString() : null;
    return {
      sub: payload.sub,
      emailPresent: Boolean(stringClaim(payload, "email")),
      iss: payload.iss,
      aud: payload.aud,
      exp,
    };
  } catch {
    return null;
  }
};

const errorSummary = (error: unknown) => {
  if (!(error instanceof Error)) return { message: String(error) };
  return {
    name: error.name,
    message: error.message,
    code: "code" in error ? (error as { code?: unknown }).code : undefined,
  };
};

const boolClaim = (payload: JWTPayload, key: string) => {
  const value = payload[key];
  return typeof value === "boolean" ? value : null;
};

const expectedIssuer = () => {
  const issuer = process.env.NEON_AUTH_ISSUER?.trim();
  if (issuer) return issuer;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEON_AUTH_ISSUER is not configured.");
  }
  return undefined;
};

const expectedAudience = () => {
  const audience = process.env.NEON_AUTH_AUDIENCE?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!audience?.length) return undefined;
  return audience.length === 1 ? audience[0] : audience;
};

const getTestUserFromHeaders = async (req: Request): Promise<AuthUser | null> => {
  if (process.env.NODE_ENV !== "test") return null;

  const appUserId = typeof req.headers["x-test-user-id"] === "string" ? req.headers["x-test-user-id"] : null;
  const authUserId =
    typeof req.headers["x-test-auth-user-id"] === "string" ? req.headers["x-test-auth-user-id"] : null;
  if (!appUserId || !authUserId) return null;

  const appUser = await prisma.appUser.findUnique({ where: { id: appUserId } });
  if (!appUser || appUser.authUserId !== authUserId) return null;

  return {
    id: appUser.authUserId,
    email: appUser.email,
    name: appUser.name,
    emailVerified: true,
  };
};

export const getUserFromRequest = async (req: Request): Promise<AuthUser | null> => {
  const testUser = await getTestUserFromHeaders(req);
  if (testUser) return testUser;

  const context = requestContext(req);
  const token = bearerTokenFrom(req);
  if (!token) {
    authLog("missing_bearer", { ...context, token: tokenShape(token) }, "warn");
    return null;
  }

  if (!isJwtLike(token)) {
    authLog("token_not_jwt", { ...context, token: tokenShape(token) }, "warn");
    return null;
  }

  authLog("verify_start", {
    ...context,
    jwksUrl: jwksUrl ?? getJwksUrl(),
    token: tokenShape(token),
    header: jwtHeaderSummary(token),
    claims: jwtPayloadSummary(token),
  });

  const issuer = expectedIssuer();
  const audience = expectedAudience();
  const { payload } = await jwtVerify(token, getJwks(), {
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
  });
  if (!payload.sub) {
    authLog("missing_subject", { ...context, claims: jwtPayloadSummary(token) }, "warn");
    return null;
  }

  const email = stringClaim(payload, "email");
  authLog("verify_success", {
    ...context,
    user: {
      id: payload.sub,
      email: shouldLogAuthDebug() ? email : "***",
      name: shouldLogAuthDebug() ? stringClaim(payload, "name") : "***",
    },
  });

  return {
    id: payload.sub,
    email,
    name: stringClaim(payload, "name"),
    emailVerified: boolClaim(payload, "email_verified"),
  };
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    req.user = user;
    return next();
  } catch (error) {
    authLog("verify_failed", { ...requestContext(req), error: errorSummary(error) }, "error");
    return res.status(401).json({ error: "Authentication required." });
  }
};
