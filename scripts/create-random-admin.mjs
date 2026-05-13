/**
 * Create a dedicated platform admin with random credentials (stdout + optional .env snippet).
 * Run: node scripts/create-random-admin.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function randomEmail() {
  const id = crypto.randomBytes(6).toString("hex");
  return `sysadmin.${id}@ditchapp.local`;
}

function randomPassword(length = 22) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@%^*-_";
  const bytes = crypto.randomBytes(length);
  let s = "";
  for (let i = 0; i < length; i++) s += chars[bytes[i] % chars.length];
  return s;
}

try {
  const email = randomEmail().toLowerCase();
  const password = randomPassword(24);
  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error("Collision (extremely unlikely), re-run.");
    process.exit(1);
  }

  await prisma.user.create({
    data: {
      email,
      password: hash,
      name: "Platform administrator",
      role: "admin",
    },
  });

  console.log("\n=== Dedicated admin created ===");
  console.log("Email:    ", email);
  console.log("Password: ", password);
  console.log("\nSign in at /login (driver portal). Then open /admin.");
  console.log("Rotate this password after first login.\n");

  const envPath = path.join(root, ".env");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");
    if (!env.endsWith("\n")) env += "\n";
    env +=
      "\n# Dedicated bootstrap admin (created by scripts/create-random-admin.mjs — rotate password!)\n";
    env += `ADMIN_DEDICATED_EMAIL=${email}\n`;
    env += `ADMIN_DEDICATED_PASSWORD=${password}\n`;
    if (!env.includes("ADMIN_EMAILS=")) {
      env += `ADMIN_EMAILS=${email}\n`;
    } else {
      env = env.replace(
        /^(ADMIN_EMAILS=)(.*)$/m,
        (_, k, v) => {
          const list = v.split(",").map((x) => x.trim()).filter(Boolean);
          if (!list.includes(email)) list.push(email);
          return `${k}${list.join(",")}`;
        },
      );
    }
    fs.writeFileSync(envPath, env, "utf8");
    console.log("Updated .env: APPENDED credentials + merged ADMIN_EMAILS\n");
  }
} finally {
  await prisma.$disconnect();
}
