import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for AES-GCM

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.trim().length === 0) {
    throw new Error(
      "FATAL SECURITY ERROR: ENCRYPTION_KEY is missing from environment variables. " +
      "Integration credential encryption requires a dedicated 64-character hex string (32 bytes). " +
      "Fallback to JWT_SECRET is strictly forbidden."
    );
  }

  const cleanHex = keyHex.trim();
  if (cleanHex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
    throw new Error(
      `FATAL SECURITY ERROR: ENCRYPTION_KEY must be a valid 64-character hex string (32 bytes). Received length: ${cleanHex.length}`
    );
  }

  return Buffer.from(cleanHex, "hex");
}

/**
 * Encrypts sensitive integration credentials (e.g. access tokens, refresh tokens).
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts encrypted integration credentials.
 * Input format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function decryptToken(cipherText: string): string {
  if (!cipherText) return "";
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext payload format. Expected iv:authTag:encryptedContent");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}
