export const SESSION_COOKIE = "session";
export const ADMIN_ELEVATION_COOKIE = "admin_elevation";
export const TOKEN_ISSUER = "surat-digital";

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  const encoded = secret ? new TextEncoder().encode(secret) : null;

  if (!encoded || encoded.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes.");
  }

  return encoded;
}

export function invitationAccessCookieName(invitationId: string): string {
  return `invite_access_${invitationId}`;
}
