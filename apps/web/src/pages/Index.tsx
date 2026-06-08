import { Navigate } from "react-router-dom";
import { defaultRouteForRole, useAuth } from "@/lib/auth";

export default function Index() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={defaultRouteForRole(user.role)} replace />;
}
