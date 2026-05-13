import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      tier?: string;
      role?: string;
      isAdmin?: boolean;
      orgRole?: string | null;
      orgName?: string | null;
      organizationId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    tier?: string;
    role?: string;
    isAdmin?: boolean;
    orgRole?: string | null;
    orgName?: string | null;
    organizationId?: string | null;
  }
}
