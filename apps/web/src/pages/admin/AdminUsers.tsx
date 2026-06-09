import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { listUsers, deleteUser } from "@/api/users";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import type { Role, User } from "@packetflow/types";

const ROLES: Array<Role | "all"> = ["all", "admin", "carrier", "sender", "recipient"];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [filter, setFilter] = useState<Role | "all">("all");
  const [users, setUsers] = useState<User[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // TODO: replace with a useQuery hook once the API endpoint is live
  useEffect(() => {
    listUsers().then(setUsers).catch(() => {});
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeletingId(target.id);
    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      toast({ title: "User deleted" });
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      toast({ title: message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

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
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
                <td className="px-4 py-3 text-right">
                  {currentUser?.id === user.id ? (
                    <span className="text-xs text-muted-foreground">You</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(user)}
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user?"
        description={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.email}) will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete user"
        destructive
        pending={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
