import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/db";
import { resolveEffectiveTier } from "@/lib/billing/effectiveTier";
import {
  loadPlatformSettingsMap,
} from "@/lib/platformSettings";
import {
  resolveAppleOAuthCredentials,
  resolveGoogleOAuth,
  resolveMicrosoftOAuth,
} from "@/lib/oauthCredentialResolution";

async function buildOAuthProviders() {
  const map = await loadPlatformSettingsMap();
  const list: NextAuthConfig["providers"] = [];

  const google = resolveGoogleOAuth(map);
  if (google.active && google.clientId && google.clientSecret) {
    list.push(Google({ clientId: google.clientId, clientSecret: google.clientSecret }));
  }

  const apple = await resolveAppleOAuthCredentials(map);
  if (apple) {
    list.push(Apple({ clientId: apple.clientId, clientSecret: apple.clientSecret }));
  }

  const microsoft = resolveMicrosoftOAuth(map);
  if (
    microsoft.active &&
    microsoft.clientId &&
    microsoft.clientSecret
  ) {
    list.push(
      MicrosoftEntraID({
        clientId: microsoft.clientId,
        clientSecret: microsoft.clientSecret,
        issuer: microsoft.issuer,
      }),
    );
  }

  return list;
}

const callbacks: NextAuthConfig["callbacks"] = {
  async jwt({ token, user, trigger }) {
    if (user) token.id = user.id;
    const uid = (token.id ?? token.sub) as string | undefined;
    if (uid && (!!user || trigger === "update")) {
      token.tier = await resolveEffectiveTier(uid);
      const allow = new Set(
        (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );
      const dbUser = await prisma.user.findUnique({
        where: { id: uid },
        select: { email: true, role: true },
      });
      token.role = dbUser?.role ?? "user";
      token.isAdmin =
        dbUser?.role === "admin" ||
        (!!dbUser?.email && allow.has(dbUser.email.toLowerCase()));
      const member = await prisma.organizationMember.findUnique({
        where: { userId: uid },
        include: { organization: true },
      });
      token.orgRole = member?.role ?? null;
      token.orgName = member?.organization?.name ?? null;
      token.organizationId = member?.organizationId ?? null;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.tier = (token.tier as string) ?? "free";
      session.user.role = (token.role as string) ?? "user";
      session.user.isAdmin = Boolean(token.isAdmin);
      session.user.orgRole =
        (token.orgRole as string | null | undefined) ?? null;
      session.user.orgName = (token.orgName as string | null | undefined) ?? null;
      session.user.organizationId =
        (token.organizationId as string | null | undefined) ?? null;
    }
    return session;
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  const oauth = await buildOAuthProviders();

  return {
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    trustHost: true,
    pages: {
      signIn: "/login",
    },
    providers: [
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          portal: { label: "Portal", type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;

          const email = String(credentials.email).toLowerCase().trim();
          const password = String(credentials.password);
          const portalRaw = String(credentials.portal ?? "driver").toLowerCase();
          if (portalRaw !== "driver" && portalRaw !== "company") return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          if (portalRaw === "company") {
            const member = await prisma.organizationMember.findUnique({
              where: { userId: user.id },
            });
            if (!member || !member.seatActive) return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        },
      }),
      ...oauth,
    ],
    callbacks,
  };
});
