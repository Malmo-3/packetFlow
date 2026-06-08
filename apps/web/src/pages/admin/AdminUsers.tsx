import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { listUsers } from "@/api/users";
import type { Role, User } from "@packetflow/types";

const ROLES: Array<Role | "all"> = ["all", "admin", "carrier", "sender", "recipient"];

export default function AdminUsers() {
  const [filter, setFilter] = useState<Role | "all">("all");
  const [users, setUsers] = useState<User[]>([]);

  // TODO: replace with a useQuery hook once the API endpoint is live
  useEffect(() => {
    listUsers().then(setUsers).catch(() => {});
  }, []);

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="mt-1 text-muted-foreground">Directory of all users in the PacketFlow workspace.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === role
                ? "border-border bg-secondary text-foreground"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {role === "all" ? "All roles" : role}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.name}</div>
                  {user.address && <div className="text-xs text-muted-foreground">{user.address}</div>}
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full border border-border bg-secondary px-2 py-0.5 text-xs capitalize">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
