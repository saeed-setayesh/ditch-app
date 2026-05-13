import AccountingView from "./AccountingView";

export default function AdminAccountingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Accounting</h2>
        <p className="mt-1 text-sm text-muted">
          Stripe balance, recent payout activity, and charge volume (approx.).
        </p>
      </div>
      <AccountingView />
    </div>
  );
}
