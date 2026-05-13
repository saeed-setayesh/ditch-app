/**
 * Prisma seed — grants platform admin (`User.role = admin`).
 *
 * Resolution order:
 * 1. SEED_ADMIN_EMAIL
 * 2. First comma-separated entry in ADMIN_EMAILS
 * 3. Else: earliest registered user (by createdAt) — one-time bootstrap
 *
 * If there are zero users: set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD to create an admin (credentials).
 *
 * Usage: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function pickEmailFromEnv() {
  const direct = process.env.SEED_ADMIN_EMAIL?.trim();
  if (direct) return direct;
  const fromList = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (fromList) return fromList;
  return null;
}

async function main() {
  let email = pickEmailFromEnv();

  if (!email) {
    const first = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { email: true },
    });
    if (first) {
      email = first.email;
      console.warn(
        "[seed] No SEED_ADMIN_EMAIL or ADMIN_EMAILS — promoting earliest user:",
        email,
      );
    }
  }

  if (!email) {
    const fallback = process.env.SEED_ADMIN_EMAIL?.trim();
    const password = process.env.SEED_ADMIN_PASSWORD?.trim();
    if (!fallback || !password) {
      console.log(
        "[seed] No users in DB. Create one via /register, or set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD to create an admin account.",
      );
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email: fallback.toLowerCase(),
        password: hash,
        name: "Platform Admin",
        role: "admin",
      },
    });
    console.log("[seed] Created admin user:", fallback.toLowerCase());
    return;
  }

  const normalized = email.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    const password = process.env.SEED_ADMIN_PASSWORD?.trim();
    if (!password) {
      console.error("[seed] No user with email", email, "— register or set SEED_ADMIN_PASSWORD to create.");
      process.exitCode = 1;
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: {
        email: normalized,
        password: hash,
        name: "Platform Admin",
        role: "admin",
      },
      select: { id: true, email: true, role: true },
    });
    console.log("[seed] Created admin user:", user.email);
    return;
  }

  if (user.role === "admin") {
    console.log("[seed] Already admin:", user.email);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });
  console.log("[seed] Granted role=admin to", user.email);
}

await main();
await prisma.$disconnect();
