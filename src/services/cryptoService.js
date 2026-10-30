const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config/env");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY = crypto.createHash("sha256").update(String(config.ENCRYPTION_KEY)).digest();

function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decrypt(cipherText) {
  if (!cipherText) return "";
  const parts = cipherText.split(":");
  if (parts.length !== 3) return cipherText; // Return as is if not encrypted format
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function generateToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function maskSecret(secret, visibleChars = 4) {
  if (!secret || typeof secret !== "string") return "";
  if (secret.length <= visibleChars * 2) return "••••••••";
  const prefix = secret.slice(0, 4);
  const suffix = secret.slice(-visibleChars);
  return `${prefix}••••••••${suffix}`;
}

module.exports = {
  encrypt,
  decrypt,
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  maskSecret,
};
