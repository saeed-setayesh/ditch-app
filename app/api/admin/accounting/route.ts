import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserAdmin } from "@/lib/adminAuth";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Summary of Stripe money for admin dashboard (approximate — use Stripe Dashboard for accounting truth). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await stripeConfigured())) {
    return NextResponse.json(
      {
        error: "Stripe is not configured.",
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const stripe = await getStripe();
    const balance = await stripe.balance.retrieve();

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    const charges = await stripe.charges.list({
      limit: 100,
      created: { gte: thirtyDaysAgo },
    });

    let grossCents = 0;
    let succeeded = 0;
    for (const c of charges.data) {
      if (c.status === "succeeded" && !c.refunded) {
        grossCents += c.amount;
        succeeded += 1;
      }
    }

    const payouts = await stripe.payouts.list({ limit: 20 });

    return NextResponse.json({
      configured: true,
      balance: {
        available: balance.available,
        pending: balance.pending,
        livemode: balance.livemode,
      },
      last30Days: {
        chargeCount: succeeded,
        grossCents,
        currency: charges.data[0]?.currency ?? "cad",
      },
      recentPayouts: payouts.data.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        arrivalDate: p.arrival_date,
      })),
    });
  } catch (e) {
    console.error("Admin accounting error:", e);
    return NextResponse.json(
      { error: "Failed to load Stripe accounting data." },
      { status: 502 },
    );
  }
}
