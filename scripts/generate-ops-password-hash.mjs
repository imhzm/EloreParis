import { randomBytes, scryptSync } from "node:crypto";
import process from "node:process";

function createOpsPasswordHash(password) {
  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    throw new Error("Password is required.");
  }

  const salt = randomBytes(16);
  const derivedKey = scryptSync(normalizedPassword, salt, 64);
  return `scrypt$${salt.toString("base64")}$${derivedKey.toString("base64")}`;
}

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/generate-ops-password-hash.mjs \"StrongPassword\"");
  process.exit(1);
}

console.log(createOpsPasswordHash(password));
