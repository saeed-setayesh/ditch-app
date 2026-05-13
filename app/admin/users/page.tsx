import UsersTable from "./UsersTable";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Users</h2>
        <p className="mt-1 text-sm text-muted">
          Grant or revoke Pro access and platform admin role.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
