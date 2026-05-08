import { prisma } from "@/lib/db";

/** Active seated members in the same organization (includes caller). */
export async function orgPeerUserIds(userId: string): Promise<string[]> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, seatActive: true },
    select: { organizationId: true },
  });
  if (!membership) return [];
  const peers = await prisma.organizationMember.findMany({
    where: {
      organizationId: membership.organizationId,
      seatActive: true,
    },
    select: { userId: true },
  });
  return peers.map((p) => p.userId);
}
