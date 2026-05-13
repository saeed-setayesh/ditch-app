import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminHomePage() {
  const [userCount, proish] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        OR: [
          { tier: "pro" },
          { stripeSubscriptionStatus: { in: ["active", "trialing"] } },
        ],
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <p className="text-muted">
        Manage users, review revenue signals from Stripe, and override payment
        keys or price IDs without redeploying (secrets load from the database
        after a short cache).
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Registered users
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {userCount}
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Pro / active sub (approx.)
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {proish}
          </p>
        </div>
        <div className="rounded-2xl border border-sky/25 bg-sky/10 p-6 shadow-sm">
          <p className="text-sm font-semibold text-deep">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li>
              <Link href="/admin/users" className="text-sky underline">
                User list →
              </Link>
            </li>
            <li>
              <Link href="/admin/accounting" className="text-sky underline">
                Accounting →
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className="text-sky underline">
                Stripe settings →
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
