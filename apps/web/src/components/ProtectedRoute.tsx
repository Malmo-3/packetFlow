/**
 * Route guard that enforces authentication and role-based access.
 *
 * Behaviour:
 * - While `loading` (auth check in-flight): renders `null` to avoid flicker.
 * - Not authenticated: redirects to `/login`, preserving the intended path in `state.from`.
 * - Wrong role: renders an explanatory error with a link to the user's own dashboard
 *   (better than a silent redirect — makes debugging easier).
 * - Correct role: renders `children`.
 *
 * @example
 * ```tsx
 * <ProtectedRoute allow={["admin"]}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 */
import { Link, Navigate, useLocation } from "react-router-dom";
import { defaultRouteForRole, useAuth } from "@/lib/auth";
import type { Role } from "@packetflow/types";

export function ProtectedRoute({ children, allow }: { children: JSX.Element; allow: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!allow.includes(user.role)) {
    // Show a clear error instead of silently redirecting — makes debugging easier
    // and lets the user know they need to switch accounts.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-center">
        <div className="max-w-sm space-y-4">
          <p className="text-4xl">🔒</p>
          <h1 className="text-2xl font-bold">Wrong account</h1>
          <p className="text-muted-foreground">
            You're signed in as <strong>{user.email}</strong> ({user.role}), but this page
            requires a <strong>{allow.join(" or ")}</strong> account.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to={defaultRouteForRole(user.role)}
              className="inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/85"
            >
              Go to my dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
