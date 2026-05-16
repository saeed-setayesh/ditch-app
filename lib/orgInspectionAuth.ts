import { prisma } from "@/lib/db";
import type { OrganizationMember } from "@prisma/client";

export type ActiveOrgMember = OrganizationMember & {
  organization: { id: string; name: string };
};

export async function getActiveOrgMember(
  userId: string,
): Promise<ActiveOrgMember | null> {
  const member = await prisma.organizationMember.findFirst({
    where: { userId, seatActive: true },
    include: { organization: { select: { id: true, name: true } } },
  });
  return member;
}

export function requireOrgAdmin(member: ActiveOrgMember | null): member is ActiveOrgMember {
  return !!member && member.role === "admin";
}

export async function assertInspectionAccess(opts: {
  userId: string;
  member: ActiveOrgMember | null;
  inspection: {
    organizationId: string;
    driverUserId: string;
    status: string;
  };
  needWrite: boolean;
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { userId, member, inspection, needWrite } = opts;
  if (!member || member.organizationId !== inspection.organizationId) {
    return { ok: false, status: 403, message: "Not in organization" };
  }

  if (!needWrite) {
    const isAdmin = member.role === "admin";
    const isOwner = inspection.driverUserId === userId;
    if (!isAdmin && !isOwner) {
      return { ok: false, status: 403, message: "Not allowed to view this inspection" };
    }
    return { ok: true };
  }

  const isAdmin = member.role === "admin";
  const isOwner = inspection.driverUserId === userId;
  if (inspection.status === "finalized") {
    return { ok: false, status: 409, message: "Inspection is finalized" };
  }
  if (!isAdmin && !isOwner) {
    return { ok: false, status: 403, message: "Not allowed to edit this inspection" };
  }
  return { ok: true };
}
