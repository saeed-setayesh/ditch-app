import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PatchBody = {
  proActive?: boolean;
  role?: "user" | "admin";
  organizationId?: string | null;
  orgRole?: "admin" | "driver";
  seatActive?: boolean;
};

async function selectUserWithOrg(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tier: true,
      stripeSubscriptionStatus: true,
      organizationMember: {
        select: {
          organizationId: true,
          role: true,
          seatActive: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData: {
    tier?: string;
    stripeSubscriptionStatus?: string | null;
    role?: string;
  } = {};

  if (typeof body.proActive === "boolean") {
    if (body.proActive) {
      userData.tier = "pro";
      userData.stripeSubscriptionStatus = "active";
    } else {
      userData.tier = "free";
      userData.stripeSubscriptionStatus = null;
    }
  }

  if (body.role === "admin" || body.role === "user") {
    if (id === session.user.id && body.role === "user") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role here." },
        { status: 400 },
      );
    }
    userData.role = body.role;
  }

  const updatesOrg = body.organizationId !== undefined;
  const hasUserPatch = Object.keys(userData).length > 0;

  if (!updatesOrg && !hasUserPatch) {
    return NextResponse.json(
      {
        error:
          "No valid fields — send proActive, role, and/or organizationId (null to unlink).",
      },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (updatesOrg) {
        if (body.organizationId === null) {
          await tx.organizationMember.deleteMany({ where: { userId: id } });
        } else if (typeof body.organizationId === "string") {
          const orgId = body.organizationId.trim();
          if (!orgId) {
            throw new Error("EMPTY_ORG");
          }
          const org = await tx.organization.findUnique({
            where: { id: orgId },
          });
          if (!org) {
            throw new Error("ORG_NOT_FOUND");
          }
          const orgRole =
            body.orgRole === "admin" || body.orgRole === "driver"
              ? body.orgRole
              : "driver";
          const seatActive = body.seatActive !== false;
          await tx.organizationMember.upsert({
            where: { userId: id },
            create: {
              userId: id,
              organizationId: orgId,
              role: orgRole,
              seatActive,
            },
            update: {
              organizationId: orgId,
              role: orgRole,
              seatActive,
            },
          });
        }
      }

      if (hasUserPatch) {
        await tx.user.update({
          where: { id },
          data: userData,
        });
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ORG_NOT_FOUND") {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }
    if (msg === "EMPTY_ORG") {
      return NextResponse.json({ error: "Invalid organization id" }, { status: 400 });
    }
    throw e;
  }

  const updated = await selectUserWithOrg(id);
  return NextResponse.json({ user: updated });
}
