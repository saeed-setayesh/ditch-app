import PlatformSettingsForm from "./PlatformSettingsForm";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Platform &amp; Stripe</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Database values override environment variables for server-side Stripe
          calls (with a ~60s cache). Never commit secrets to git; restrict who
          has admin access.
        </p>
      </div>
      <PlatformSettingsForm />
    </div>
  );
}
