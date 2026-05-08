import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function syncStripeSubscription(
  sub: Stripe.Subscription,
): Promise<void> {
  const status = sub.status;
  const periodEndTs = sub.current_period_end;

  const fromUser = await prisma.user.findFirst({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true },
  });
  if (fromUser) {
    await prisma.user.update({
      where: { id: fromUser.id },
      data: {
        stripeSubscriptionStatus: status,
        tier: status === "active" || status === "trialing" ? "pro" : "free",
      },
    });
    return;
  }

  const orgRow = await prisma.organizationSubscription.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });
  if (orgRow) {
    let seatQuantity = orgRow.seatQuantity;
    const item = sub.items?.data?.[0];
    if (item?.quantity != null && item.quantity > 0) seatQuantity = item.quantity;
    await prisma.organizationSubscription.update({
      where: { id: orgRow.id },
      data: {
        status,
        seatQuantity,
        currentPeriodEnd: periodEndTs
          ? new Date(periodEndTs * 1000)
          : null,
      },
    });
  }
}

export async function applyCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const kind = session.metadata?.kind;
  const stripe = getStripe();
  const subscriptionId = session.subscription;
  const customerId = session.customer;
  if (typeof subscriptionId !== "string" || typeof customerId !== "string") {
    return;
  }
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const status = sub.status;

  if (kind === "b2c_pro" && session.metadata?.userId) {
    const userId = session.metadata.userId;
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: status,
        tier: status === "active" || status === "trialing" ? "pro" : "free",
      },
    });
    return;
  }

  if (kind === "org_seats" && session.metadata?.organizationId) {
    const organizationId = session.metadata.organizationId;
    const item = sub.items?.data?.[0];
    const seatQuantity =
      item?.quantity != null && item.quantity > 0 ? item.quantity : 1;

    await prisma.organization.updateMany({
      where: { id: organizationId },
      data: { stripeCustomerId: customerId },
    });

    await prisma.organizationSubscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        stripeSubscriptionId: subscriptionId,
        status,
        seatQuantity,
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null,
      },
      update: {
        stripeSubscriptionId: subscriptionId,
        status,
        seatQuantity,
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null,
      },
    });
  }
}
