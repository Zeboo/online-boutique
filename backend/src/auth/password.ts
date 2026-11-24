import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const MAX_PASSWORD_BYTES = 128;

function validatePasswordSize(password: string) {
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error("Password must be no more than 128 UTF-8 bytes");
  }
}

function deriveKey(password: string, salt: string, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, { N: 16_384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordSize(password);
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH);
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  validatePasswordSize(password);
  const [algorithm, n, r, p, salt, expected] = storedHash.split("$");
  if (algorithm !== "scrypt" || n !== "16384" || r !== "8" || p !== "1" || !salt || !expected) {
    return false;
  }

  const expectedKey = Buffer.from(expected, "base64url");
  const actualKey = await deriveKey(password, salt, expectedKey.length);

  return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
}
