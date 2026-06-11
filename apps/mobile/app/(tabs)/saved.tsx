import { useCallback, useState } from "react";
import { View, Text, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useAuth } from "../../src/context/AuthContext";
import { usePackages } from "../../src/hooks/usePackages";
import { listSavedTracking, removeTrackingCode } from "../../src/api/savedTracking";
import { Screen, ScreenHeader, Card, Button, Loading, EmptyState } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/StatusBadge";

export default function SavedPackages() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { data: packages = [], isLoading, refetch, isRefetching } = usePackages();
  const [codes, setCodes] = useState<string[]>([]);

  const loadCodes = useCallback(() => {
    if (!user) return;
    listSavedTracking(user.id).then(setCodes).catch(() => {});
  }, [user]);

  useFocusEffect(useCallback(() => { loadCodes(); }, [loadCodes]));

  const remove = async (code: string) => {
    if (!user) return;
    await removeTrackingCode(user.id, code);
    setCodes((prev) => prev.filter((c) => c !== code));
  };

  const saved = codes.map((code) => ({
    code,
    pkg: packages.find((p) => p.trackingCode.toLowerCase() === code.toLowerCase()),
  }));

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.foreground} />}>
      <ScreenHeader title="Saved packages" subtitle="Your most important shipments, one tap away." />

      <Button label="Track a package" icon="search" onPress={() => router.push("/(tabs)/track")} />

      {isLoading ? (
        <Loading />
      ) : saved.length === 0 ? (
        <Card>
          <EmptyState icon="star-outline" title="No saved packages yet" hint="Track a package by code and save it here." />
        </Card>
      ) : (
        saved.map(({ code, pkg }) => (
          <Card key={code} style={{ gap: 8 }}>
            {pkg ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontFamily: "monospace", color: colors.foreground, fontWeight: "700", flex: 1 }}>{pkg.trackingCode}</Text>
                  <StatusBadge status={pkg.status} />
                </View>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>{pkg.recipientName}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{pkg.pickupCity} → {pkg.destinationCity}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <Button label="Open tracking" variant="secondary" onPress={() => router.push(`/package/${pkg.id}`)} />
                  <Button label="Remove" variant="ghost" icon="star" onPress={() => remove(code)} />
                </View>
              </>
            ) : (
              <>
                <Text style={{ fontFamily: "monospace", color: colors.mutedForeground }}>{code}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>This code no longer matches an available package.</Text>
                <Button label="Remove" variant="ghost" icon="star" onPress={() => remove(code)} />
              </>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
