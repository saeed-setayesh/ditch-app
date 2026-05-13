/**
 * Create (or update) a user with password and an organization + active seat
 * so they can sign in via Login → Company.
 *
 * Usage (from repo root, DATABASE_URL set):
 *   node scripts/seed-company-account.mjs
 *   node scripts/seed-company-account.mjs you@example.com yourPassword "Fleet Name"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email =
  (process.argv[2] && process.argv[2].trim()) || "operator@ditchapp-demo.local";
const password =
  (process.argv[3] && process.argv[3].trim()) || "DitchDemo2026!";
const orgName =
  (process.argv[4] && process.argv[4].trim()) || "Demo Towing (QA)";

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

try {
  const normalized = email.toLowerCase().trim();
  const hashed = await bcrypt.hash(password, 12);

  let user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalized,
        name: "Demo operator",
        password: hashed,
      },
    });
    console.log("Created user:", normalized);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    console.log("Updated password for existing user:", normalized);
  }

  const member = await prisma.organizationMember.findUnique({
    where: { userId: user.id },
  });

  if (member) {
    await prisma.organizationMember.update({
      where: { userId: user.id },
      data: { seatActive: true, role: "admin" },
    });
    console.log("Existing org membership: seat set active, role admin.");
  } else {
    await prisma.organization.create({
      data: {
        name: orgName,
        members: {
          create: {
            userId: user.id,
            role: "admin",
            seatActive: true,
          },
        },
      },
    });
    console.log("Created organization:", orgName);
  }

  console.log("\nSign in at /login → Company tab:");
  console.log("  Email:   ", normalized);
  console.log("  Password:", password);
  console.log(
    "\nThen open /company/dashboard (or you will be redirected after login).",
  );
} finally {
  await prisma.$disconnect();
}
