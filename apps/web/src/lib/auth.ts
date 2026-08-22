import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { db } from "db";
import { users, tenants } from "db";
import { and, eq } from "drizzle-orm";
import {
  ADMIN_ELEVATION_COOKIE,
  getJwtSecret,
  invitationAccessCookieName,
  SESSION_COOKIE,
  TOKEN_ISSUER,
} from "./session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const stored = Buffer.from(hash, "hex");
    const calculated = scryptSync(password, salt, 64);
    return stored.length === calculated.length && timingSafeEqual(stored, calculated);
  } catch {
    return false;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(TOKEN_ISSUER)
    .setAudience("session")
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  cookieStore.set(ADMIN_ELEVATION_COOKIE, "", { path: "/admin", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: "session",
    });

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.tenantId !== "string"
    ) {
      return null;
    }

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const [user, tenant] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.userId),
    }),
    db.query.tenants.findFirst({
      where: and(
        eq(tenants.id, session.tenantId),
        eq(tenants.ownerUserId, session.userId)
      ),
    }),
  ]);

  if (!user || !tenant || user.role === "suspended") return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: tenant.id,
  };
}

export async function createAdminElevation(userId: string) {
  const token = await new SignJWT({ userId, purpose: "admin-elevation" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(TOKEN_ISSUER)
    .setAudience("admin-elevation")
    .setExpirationTime("2h")
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ELEVATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 2,
  });
}

export async function isAdminElevated(userId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_ELEVATION_COOKIE)?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: "admin-elevation",
    });

    return payload.userId === userId && payload.purpose === "admin-elevation";
  } catch {
    return false;
  }
}

export async function clearAdminElevation() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ELEVATION_COOKIE, "", { path: "/admin", maxAge: 0 });
}

export async function createInvitationAccess(invitationId: string) {
  const token = await new SignJWT({ invitationId, purpose: "invitation-access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(TOKEN_ISSUER)
    .setAudience("invitation-access")
    .setExpirationTime("24h")
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(invitationAccessCookieName(invitationId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function hasInvitationAccess(invitationId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(invitationAccessCookieName(invitationId))?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: "invitation-access",
    });

    return payload.invitationId === invitationId && payload.purpose === "invitation-access";
  } catch {
    return false;
  }
}
