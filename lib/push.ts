import webpush from "web-push";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(
    "mailto:support@DitchApp-accident-alert.local",
    vapidPublic,
    vapidPrivate,
  );
}

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function sendPushNotification(
  subscription: PushSubscriptionPayload,
  payload: { title: string; body: string; icon?: string; url?: string },
): Promise<boolean> {
  if (!vapidPublic || !vapidPrivate) {
    console.warn("VAPID keys not set; skipping push");
    return false;
  }
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload),
      { TTL: 60 },
    );
    return true;
  } catch (e) {
    console.error("web-push error:", e);
    return false;
  }
}
