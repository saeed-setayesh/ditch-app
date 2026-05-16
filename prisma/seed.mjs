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

/**
 * Optional: set SEED_DVIR_ORG_ID to an organization `id` to insert one starter
 * inspection template (editable JSON checklist v1) when the org has none.
 */
async function seedDvirExampleTemplate() {
  const orgId = process.env.SEED_DVIR_ORG_ID?.trim();
  if (!orgId) return;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    console.warn("[seed] SEED_DVIR_ORG_ID: organization not found:", orgId);
    return;
  }

  const existing = await prisma.inspectionTemplate.findFirst({
    where: { organizationId: orgId },
  });
  if (existing) {
    console.log("[seed] DVIR: org already has inspection templates, skipping");
    return;
  }

  const checklistSchema = {
    version: 1,
    sections: [
      {
        title: "Starter — brakes & tires",
        items: [
          {
            id: "starter-brakes",
            label: "Service brakes — pedal feel / air pressure acceptable",
            defectLabels: ["Low pressure", "Pedal spongy"],
            requirePhotoOnDefect: true,
          },
          {
            id: "starter-tires",
            label: "Tires — inflation & visible damage",
            defectLabels: ["Under-inflated", "Cord visible"],
            requirePhotoOnDefect: true,
          },
          {
            id: "starter-lights",
            label: "Head / tail / marker lamps operational",
            defectLabels: ["Inoperative lamp"],
          },
        ],
      },
    ],
  };

  await prisma.$transaction(async (tx) => {
    const t = await tx.inspectionTemplate.create({
      data: {
        organizationId: orgId,
        name: "Starter CVOR-style checklist",
        description:
          "Example items only — customize with your compliance advisor.",
      },
    });
    await tx.inspectionTemplateVersion.create({
      data: {
        templateId: t.id,
        version: 1,
        checklistSchema,
      },
    });
  });

  console.log("[seed] DVIR: created starter inspection template for org", orgId);
}

await main();
await seedDvirExampleTemplate();
await prisma.$disconnect();
