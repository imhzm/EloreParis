import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const OPS_PASSWORD_HASH_PREFIX = "scrypt";
const OPS_PASSWORD_HASH_KEY_LENGTH = 64;

export function createOpsPasswordHash(password: string) {
  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    throw new Error("Ops password cannot be empty.");
  }

  const salt = randomBytes(16);
  const derivedKey = scryptSync(
    normalizedPassword,
    salt,
    OPS_PASSWORD_HASH_KEY_LENGTH,
  );

  return `${OPS_PASSWORD_HASH_PREFIX}$${salt.toString("base64")}$${derivedKey.toString("base64")}`;
}

export function verifyOpsPasswordHash(
  password: string,
  passwordHash: string | undefined,
) {
  if (!passwordHash) {
    return false;
  }

  const [prefix, saltBase64, derivedKeyBase64] = passwordHash.split("$");

  if (
    prefix !== OPS_PASSWORD_HASH_PREFIX ||
    !saltBase64 ||
    !derivedKeyBase64
  ) {
    return false;
  }

  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    return false;
  }

  try {
    const salt = Buffer.from(saltBase64, "base64");
    const expectedDerivedKey = Buffer.from(derivedKeyBase64, "base64");
    const actualDerivedKey = scryptSync(
      normalizedPassword,
      salt,
      expectedDerivedKey.length || OPS_PASSWORD_HASH_KEY_LENGTH,
    );

    return (
      actualDerivedKey.length === expectedDerivedKey.length &&
      timingSafeEqual(actualDerivedKey, expectedDerivedKey)
    );
  } catch {
    return false;
  }
}
