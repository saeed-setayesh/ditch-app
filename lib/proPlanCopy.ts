/** Shared copy for Pro plan — keep in sync with billing limits in API / AlertPreferences. */
export const MAX_RADIUS_FREE_KM = 5;
export const MAX_RADIUS_PRO_KM = 20;

export const PRO_BENEFITS_HEADLINE = "What you get with Pro";

export function getProBenefitBullets(): string[] {
  return [
    "Traffic heatmaps (platform history and live TomTom layer where available)",
    `Nearby incident push alerts up to ${MAX_RADIUS_PRO_KM} km radius (Free is up to ${MAX_RADIUS_FREE_KM} km)`,
    "Tow-score and extra filters so alerts match how you work",
    "Subscription managed securely through Stripe (update card, invoices, cancel anytime)",
  ];
}
