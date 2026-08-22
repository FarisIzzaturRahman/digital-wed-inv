import { createHmac, timingSafeEqual } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(value: string): Buffer {
  const normalized = value.toUpperCase().replace(/[\s=-]/g, "");
  let bits = "";

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      throw new Error("ADMIN_TOTP_SECRET is not valid base32.");
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTotp(secret: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyAdminTotp(code: string, now = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const configuredSecret = process.env.ADMIN_TOTP_SECRET?.trim();
  if (!configuredSecret) {
    throw new Error("ADMIN_TOTP_SECRET is not configured.");
  }

  const secret = decodeBase32(configuredSecret);
  const currentCounter = Math.floor(now / 30_000);
  const supplied = Buffer.from(code);

  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(generateTotp(secret, currentCounter + drift));
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) {
      return true;
    }
  }

  return false;
}
