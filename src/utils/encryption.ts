
import crypto from "crypto";

const algorithm = "aes-256-gcm";

const getEncryptionKey = () => {
  const key = process.env.MP_ENCRYPTION_KEY;

  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("MP_ENCRYPTION_KEY inválida.");
  }

  return Buffer.from(key, "hex");
};

export const encryptToken = (token: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    algorithm,
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decryptToken = (encryptedToken: string): string => {
  const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Token criptografado inválido.");
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
