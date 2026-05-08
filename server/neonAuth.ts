import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getNeonAuthUrl = () => {
  const authUrl = process.env.VITE_NEON_AUTH_URL;
  if (!authUrl) {
    throw new Error("VITE_NEON_AUTH_URL is not configured.");
  }
  return authUrl.endsWith("/") ? authUrl : `${authUrl}/`;
};

const getJwks = () => {
  jwks ??= createRemoteJWKSet(new URL("jwt", getNeonAuthUrl()));
  return jwks;
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

export const getUserFromRequest = async (req: Request): Promise<AuthUser | null> => {
  const token = bearerTokenFrom(req);
  if (!token) return null;

  const { payload } = await jwtVerify(token, getJwks());
  if (!payload.sub) return null;

  const email = stringClaim(payload, "email");
  return {
    id: payload.sub,
    email,
    name: stringClaim(payload, "name"),
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
    next();
  } catch (error) {
    console.error("Backend auth verification failed", {
      path: req.path,
      method: req.method,
      error,
    });
    res.status(401).json({ error: "Authentication required." });
  }
};
