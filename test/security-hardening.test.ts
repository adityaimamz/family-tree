import { afterEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import { loadAppUser } from "../server/authorization.js";
import { prisma } from "../server/db.js";
import app from "../server/app.js";
import { requireAuth, resetAuthJwksForTests } from "../server/neonAuth.js";
import { redactSensitiveText, safeRequestPath } from "../server/security.js";
import { cleanupDatabase } from "./setup.js";

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & typeof res;
};

const createSecuritySpace = async (role: "owner" | "admin" | "member" = "owner") => {
  const timestamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const user = await prisma.appUser.create({
    data: {
      authUserId: `security-test-auth-${timestamp}`,
      email: `security-${timestamp}@example.com`,
      name: "Security Test User",
    },
  });
  const space = await prisma.familySpace.create({
    data: {
      slug: `security-test-space-${timestamp}`,
      name: "Security Test Space",
    },
  });
  await prisma.familyMembership.create({
    data: { userId: user.id, familySpaceId: space.id, role },
  });
  return { user, space };
};

afterEach(async () => {
  vi.unstubAllGlobals();
  resetAuthJwksForTests();
  delete process.env.NEON_AUTH_ISSUER;
  delete process.env.NEON_AUTH_AUDIENCE;
  delete process.env.AI_EXTERNAL_ENABLED;

  const spaces = await prisma.familySpace.findMany({
    where: { slug: { startsWith: "security-test-space-" } },
    select: { id: true },
  });
  for (const space of spaces) {
    await cleanupDatabase(space.id);
  }
  await prisma.appUser.deleteMany({
    where: { authUserId: { startsWith: "security-test-auth-" } },
  });
});

describe("security hardening", () => {
  it("accepts JWTs only from the configured issuer and audience", async () => {
    process.env.VITE_NEON_AUTH_URL = "https://auth.example.test";
    process.env.NEON_AUTH_ISSUER = "https://issuer.example.test";
    process.env.NEON_AUTH_AUDIENCE = "family-tree";

    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const key = { ...jwk, kid: "security-test-key", alg: "RS256", use: "sig" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ keys: [key] }), { status: 200 })),
    );

    const signToken = (issuer: string) =>
      new SignJWT({
        email: "jwt-user@example.com",
        name: "JWT User",
        email_verified: true,
      })
        .setProtectedHeader({ alg: "RS256", kid: "security-test-key" })
        .setSubject("jwt-auth-subject")
        .setIssuer(issuer)
        .setAudience("family-tree")
        .setExpirationTime("5m")
        .sign(privateKey);

    const goodReq = {
      headers: { authorization: `Bearer ${await signToken("https://issuer.example.test")}` },
      method: "GET",
      originalUrl: "/api/auth/me",
      path: "/api/auth/me",
    } as unknown as Request;
    const goodRes = createResponse();
    const goodNext = vi.fn();
    await requireAuth(goodReq, goodRes, goodNext as unknown as NextFunction);
    expect(goodNext).toHaveBeenCalledOnce();
    expect(goodReq.user).toMatchObject({
      id: "jwt-auth-subject",
      email: "jwt-user@example.com",
      emailVerified: true,
    });

    const badReq = {
      headers: { authorization: `Bearer ${await signToken("https://wrong-issuer.example.test")}` },
      method: "GET",
      originalUrl: "/api/auth/me",
      path: "/api/auth/me",
    } as unknown as Request;
    const badRes = createResponse();
    await requireAuth(badReq, badRes, vi.fn() as unknown as NextFunction);
    expect(badRes.statusCode).toBe(401);
  });

  it("returns 409 instead of linking a different auth user to an existing email", async () => {
    const existing = await prisma.appUser.create({
      data: {
        authUserId: `security-test-auth-existing-${Date.now()}`,
        email: `collision-${Date.now()}@example.com`,
        name: "Existing User",
      },
    });

    const req = {
      user: {
        id: "security-test-auth-new",
        email: existing.email,
        name: "New User",
        emailVerified: true,
      },
      method: "GET",
      originalUrl: "/api/auth/me",
      path: "/api/auth/me",
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    await loadAppUser(req, res, next as unknown as NextFunction);

    expect(res.statusCode).toBe(409);
    expect(next).not.toHaveBeenCalled();
    const unchanged = await prisma.appUser.findUniqueOrThrow({ where: { id: existing.id } });
    expect(unchanged.authUserId).toBe(existing.authUserId);
  });

  it("creates bounded expiring invites and keeps code shape stable", async () => {
    const { user, space } = await createSecuritySpace("owner");

    const response = await request(app)
      .post(`/api/spaces/${space.slug}/invites`)
      .set("x-test-user-id", user.id)
      .set("x-test-auth-user-id", user.authUserId)
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.invite.code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(response.body.invite.maxUses).toBe(10);
    const expiresAt = new Date(response.body.invite.expiresAt).getTime();
    expect(expiresAt).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    expect(expiresAt).toBeLessThan(Date.now() + 8 * 24 * 60 * 60 * 1000);
  });

  it("restricts AI and family photo uploads to owner/admin roles", async () => {
    const memberContext = await createSecuritySpace("member");
    const memberAi = await request(app)
      .post(`/api/spaces/${memberContext.space.slug}/ai/generate-biography`)
      .set("x-test-user-id", memberContext.user.id)
      .set("x-test-auth-user-id", memberContext.user.authUserId)
      .send({ notes: "These are private family notes with enough context for a deterministic draft." });
    expect(memberAi.status).toBe(403);

    const memberUpload = await request(app)
      .post(`/api/uploads/photos?spaceSlug=${memberContext.space.slug}&folder=members&filename=test.jpg`)
      .set("x-test-user-id", memberContext.user.id)
      .set("x-test-auth-user-id", memberContext.user.authUserId)
      .set("Content-Type", "text/plain")
      .send("not an image");
    expect(memberUpload.status).toBe(403);

    const ownerContext = await createSecuritySpace("owner");
    const ownerAi = await request(app)
      .post(`/api/spaces/${ownerContext.space.slug}/ai/generate-biography`)
      .set("x-test-user-id", ownerContext.user.id)
      .set("x-test-auth-user-id", ownerContext.user.authUserId)
      .send({ notes: "These are private family notes with enough context for a deterministic draft." });
    expect(ownerAi.status).toBe(200);
    expect(ownerAi.body.source).toBe("deterministic");
  });

  it("redacts sensitive path, token, and invite code values in log helpers", () => {
    const text = redactSensitiveText("Bearer abc.def.ghi ABCD-2345 eyJabc.def.ghi");
    expect(text).not.toContain("ABCD-2345");
    expect(text).not.toContain("Bearer abc.def.ghi");

    const req = {
      originalUrl: "/api/invites/ABCD-2345/preview?token=secret&safe=value",
      url: "/api/invites/ABCD-2345/preview?token=secret&safe=value",
      path: "/api/invites/ABCD-2345/preview",
    } as Request;
    const path = safeRequestPath(req);
    expect(path).toContain("[INVITE_CODE_REDACTED]");
    expect(path).toContain("token=%5BREDACTED%5D");
    expect(path).toContain("safe=value");
  });
});
