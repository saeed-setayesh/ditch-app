import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isUserAdmin } from "@/lib/adminAuth";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/accounting", label: "Accounting" },
  { href: "/admin/settings", label: "Platform & Stripe" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!(await isUserAdmin(session))) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-ice text-ink">
      <header className="border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Administration
            </p>
            <h1 className="font-display text-xl font-bold">DitchApp platform</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-ice"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="rounded-lg border border-sky/30 bg-sky px-3 py-2 text-sm font-semibold text-paper shadow-sm transition hover:bg-deep"
            >
              Driver app
            </Link>
            <SignOutButton className="rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-ice" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
