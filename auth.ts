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
  PLATFORM_KEYS,
  settingTruthy,
} from "@/lib/platformSettings";
import { createAppleClientSecretCached } from "@/lib/appleClientSecret";

async function buildOAuthProviders() {
  const map = await loadPlatformSettingsMap();
  const list: NextAuthConfig["providers"] = [];

  if (settingTruthy(map.get(PLATFORM_KEYS.OAUTH_GOOGLE_ENABLED))) {
    const clientId = map.get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_ID)?.trim();
    const clientSecret = map
      .get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_SECRET)
      ?.trim();
    if (clientId && clientSecret) {
      list.push(Google({ clientId, clientSecret }));
    }
  }

  if (settingTruthy(map.get(PLATFORM_KEYS.OAUTH_APPLE_ENABLED))) {
    const clientId = map.get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_ID)?.trim();
    let clientSecret = map
      .get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_SECRET)
      ?.trim();
    const teamId = map.get(PLATFORM_KEYS.OAUTH_APPLE_TEAM_ID)?.trim();
    const keyId = map.get(PLATFORM_KEYS.OAUTH_APPLE_KEY_ID)?.trim();
    const privateKey = map.get(PLATFORM_KEYS.OAUTH_APPLE_PRIVATE_KEY)?.trim();
    if (!clientSecret && teamId && keyId && clientId && privateKey) {
      try {
        clientSecret = await createAppleClientSecretCached({
          teamId,
          keyId,
          clientId,
          privateKeyPem: privateKey,
        });
      } catch (e) {
        console.error("Apple client secret generation failed:", e);
      }
    }
    if (clientId && clientSecret) {
      list.push(Apple({ clientId, clientSecret }));
    }
  }

  if (settingTruthy(map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_ENABLED))) {
    const clientId = map
      .get(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_ID)
      ?.trim();
    const clientSecret = map
      .get(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_SECRET)
      ?.trim();
    const issuerRaw = map
      .get(PLATFORM_KEYS.OAUTH_MICROSOFT_ISSUER)
      ?.trim();
    const issuer =
      issuerRaw && issuerRaw.length > 0
        ? issuerRaw
        : "https://login.microsoftonline.com/common/v2.0/";
    if (clientId && clientSecret) {
      list.push(
        MicrosoftEntraID({
          clientId,
          clientSecret,
          issuer,
        }),
      );
    }
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
