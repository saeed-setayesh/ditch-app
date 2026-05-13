/**
 * Grant platform admin (role=admin) for /admin access.
 *
 * Also add the same email to ADMIN_EMAILS in .env as a backup allowlist.
 *
 *   node scripts/grant-admin.mjs user@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const raw = process.argv[2];
if (!raw?.trim()) {
  console.error("Usage: node scripts/grant-admin.mjs <email>");
  process.exit(1);
}

try {
  const user = await prisma.user.findFirst({
    where: { email: { equals: raw.trim(), mode: "insensitive" } },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error("No user found for email:", raw.trim());
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });

  console.log(`Granted admin for ${user.email} (was role=${user.role})`);
  console.log(
    "User should sign out and sign in again so the session picks up isAdmin.",
  );
  console.log(
    "Optional: set ADMIN_EMAILS=" +
      user.email +
      " in .env for an extra access path.",
  );
} finally {
  await prisma.$disconnect();
}
