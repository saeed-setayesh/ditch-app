import type { Session } from "next-auth";
import { prisma } from "@/lib/db";

function adminEmailAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Platform admins: `User.role === "admin"` OR email listed in `ADMIN_EMAILS` (comma-separated).
 */
export async function isUserAdmin(session: Session | null): Promise<boolean> {
  if (!session?.user?.email) return false;
  const email = session.user.email.toLowerCase();
  if (adminEmailAllowlist().has(email)) return true;
  const id = session.user.id;
  if (!id) return false;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  return user?.role === "admin";
}
