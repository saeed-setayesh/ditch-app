"use client";

import { type ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AppLogoMark from "@/components/brand/AppLogoMark";
import { SignOutButton } from "@/components/SignOutButton";
import { LogOut, Menu, X } from "lucide-react";
import { COMPANY_HUB_EXACT_PATHS, COMPANY_HUB_NAV } from "./companyHubNav";

function NoOrganizationGate() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ice px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-paper p-8 text-center shadow-sm">
        <h1 className="font-display text-xl font-bold text-ink">
          No company linked
        </h1>
        <p className="mt-2 text-sm text-muted">
          This account is not linked to an organization with an active seat. Use
          driver sign-in, or ask your fleet admin to assign you a seat.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-sky px-4 font-semibold text-paper transition hover:bg-deep"
          >
            Open driver dashboard
          </Link>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-ink/15 px-4 font-semibold text-ink transition hover:bg-ice"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyHubShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [navOpen, setNavOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ice text-muted">
        Loading…
      </div>
    );
  }

  const orgId = session?.user?.organizationId;
  const orgName = session?.user?.orgName;
  const orgRole = session?.user?.orgRole;

  if (!session?.user?.id || !orgId || !orgName) {
    return <NoOrganizationGate />;
  }

  const roleLabel =
    orgRole === "admin"
      ? "Admin"
      : orgRole === "driver"
        ? "Driver"
        : orgRole
          ? orgRole.charAt(0).toUpperCase() + orgRole.slice(1)
          : "Member";

  const closeNav = () => setNavOpen(false);

  const sidebar = (
    <>
      <div className="flex items-center gap-2.5 px-1 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-sky">
          <AppLogoMark size={36} className="h-full w-full" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="font-display text-sm font-extrabold text-paper">
            DitchApp
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
            Operator hub
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-white/[0.06] px-3 py-3">
        <div className="text-xs font-bold text-paper">{orgName}</div>
        <div className="mt-1 font-mono-brand text-[10px] text-white/55">
          Role · {roleLabel}
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {COMPANY_HUB_NAV.map(({ href, label, Icon }) => {
          const active = COMPANY_HUB_EXACT_PATHS.has(href)
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={closeNav}
              className={`flex items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-sky bg-sky/15 text-paper"
                  : "border-transparent text-white/65 hover:bg-white/[0.06] hover:text-paper"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0 opacity-90" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <Link
        href="/company"
        onClick={closeNav}
        className="mb-2 rounded-xl bg-white/[0.06] px-3 py-2.5 text-center text-[11px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-paper"
      >
        Fleet & seats (classic view)
      </Link>

      <SignOutButton
        callbackUrl="/login"
        className="w-full rounded-xl border border-white/15 px-3 py-2.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-paper"
      />
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[#e8f4fc] md:h-dvh md:flex-row md:overflow-hidden">
      {navOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeNav}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(88vw,260px)] flex-col overflow-y-auto border-r border-white/10 bg-ink px-4 py-5 text-paper transition-transform duration-200 md:relative md:z-0 md:w-[220px] md:translate-x-0 md:shrink-0 md:py-6 ${
          navOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-between bg-ink pb-1 md:hidden">
          <span className="font-display text-sm font-bold">Menu</span>
          <button
            type="button"
            onClick={closeNav}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-paper"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        {sidebar}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:min-h-0">
        <header className="flex shrink-0 items-center gap-2 border-b border-ink/[0.08] bg-paper px-3 py-2.5 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="size-[22px]" strokeWidth={2} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-bold text-ink">
              {orgName}
            </div>
            <span className="inline-flex rounded-full bg-ink px-2.5 py-0.5 font-mono-brand text-[10px] font-bold uppercase tracking-wide text-paper">
              {roleLabel}
            </span>
          </div>
          <SignOutButton
            callbackUrl="/login"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 text-muted hover:bg-ice hover:text-ink"
          >
            <LogOut className="size-[18px]" aria-hidden />
          </SignOutButton>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex min-h-full min-w-0 flex-col">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
