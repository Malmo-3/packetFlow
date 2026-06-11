import { Redirect } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { roleHome } from "../../src/lib/nav";

/** Legacy route kept for back-compat — bounces to the role's home tab. */
export default function LegacyPackages() {
  const { user } = useAuth();
  return <Redirect href={roleHome(user?.role) as never} />;
}
