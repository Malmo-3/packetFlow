import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Scan } from "@packetflow/types";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useAuth } from "../../src/context/AuthContext";
import { roleHome } from "../../src/lib/nav";
import { usePackage } from "../../src/hooks/usePackages";
import { listScansForPackage } from "../../src/api/scans";
import { listSavedTracking, removeTrackingCode, saveTrackingCode } from "../../src/api/savedTracking";
import { Screen, Card, Loading, Button } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/StatusBadge";
import { PackageTrackingView } from "../../src/components/PackageTrackingView";
import { spacing } from "../../src/theme/tokens";

export default function PackageDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: pkg, isLoading } = usePackage(id);
  const [scans, setScans] = useState<Scan[]>([]);
  const [saved, setSaved] = useState(false);

  // This screen can be the first entry in the stack (opened via a deep link, or
  // reached with router.replace from "create"), so going back may have no target.
  // Fall back to the user's home tab to avoid an unhandled GO_BACK action.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(roleHome(user?.role) as never);
  };

  useEffect(() => {
    if (!pkg?.id) return;
    let cancelled = false;
    const load = () => listScansForPackage(pkg.id).then((s) => !cancelled && setScans(s)).catch(() => {});
    load();
    // Poll so the timeline updates as the carrier scans/advances.
    const i = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [pkg?.id]);

  useEffect(() => {
    if (!user || !pkg) return;
    listSavedTracking(user.id).then((codes) => setSaved(codes.includes(pkg.trackingCode))).catch(() => {});
  }, [user, pkg?.trackingCode]);

  const toggleSave = async () => {
    if (!user || !pkg) return;
    if (saved) {
      await removeTrackingCode(user.id, pkg.trackingCode);
      setSaved(false);
    } else {
      await saveTrackingCode(user.id, pkg.trackingCode);
      setSaved(true);
    }
  };

  return (
    <Screen>
      <Pressable onPress={goBack} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Ionicons name="arrow-back" size={18} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Back</Text>
      </Pressable>

      {isLoading ? (
        <Loading />
      ) : !pkg ? (
        <Card>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 18 }}>Package not found</Text>
          <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>Check the tracking code and try again.</Text>
        </Card>
      ) : (
        <>
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "monospace", color: colors.mutedForeground, fontSize: 13 }}>{pkg.trackingCode}</Text>
            <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800" }}>Package to {pkg.recipientName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 }}>
              <StatusBadge status={pkg.status} />
              {user?.role === "recipient" && (
                <Button
                  label={saved ? "Saved" : "Save"}
                  variant={saved ? "secondary" : "primary"}
                  icon={saved ? "star" : "star-outline"}
                  onPress={toggleSave}
                />
              )}
            </View>
          </View>

          <View style={{ marginTop: spacing.xs }}>
            <PackageTrackingView pkg={pkg} scans={scans} />
          </View>
        </>
      )}
    </Screen>
  );
}
