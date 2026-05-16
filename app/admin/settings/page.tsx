import PlatformSettingsForm from "./PlatformSettingsForm";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">
          Platform, billing &amp; sign-in
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Configure Stripe, Pro/seat pricing, and OAuth providers here (stored in
          the database). Keep{" "}
          <code className="rounded bg-ink/5 px-1">AUTH_SECRET</code> and your
          public site URL in environment variables — see instructions in the form.
        </p>
      </div>
      <PlatformSettingsForm />
    </div>
  );
}
