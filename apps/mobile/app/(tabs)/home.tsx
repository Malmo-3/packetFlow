import { View, Text, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useAuth } from "../../src/context/AuthContext";
import { useSenderPackages } from "../../src/hooks/usePackages";
import { Screen, ScreenHeader, Card, Button, Loading, EmptyState } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/StatusBadge";
import { formatDate } from "../../src/lib/format";
import { spacing } from "../../src/theme/tokens";
import type { PackageView } from "../../src/api/packages";

export default function SenderHome() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { data = [], isLoading, refetch, isRefetching } = useSenderPackages(user?.id);

  const packages = [...data].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const count = (s: string) => packages.filter((p) => p.status === s).length;
  const recent = packages.slice(0, 5);

  const metrics = [
    { label: "Total", value: packages.length },
    { label: "Registered", value: count("registered") },
    { label: "In transit", value: count("in_transit") },
    { label: "Out for delivery", value: count("out_for_delivery") },
    { label: "Delivered", value: count("delivered") },
    { label: "Exceptions", value: count("exception") },
  ];

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.foreground} />}>
      <ScreenHeader title="Sender overview" subtitle="Track your shipment pipeline." />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button label="Create package" icon="add" onPress={() => router.push("/(tabs)/create")} />
        <Button label="My shipments" variant="secondary" icon="cube-outline" onPress={() => router.push("/(tabs)/shipments")} />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {metrics.map((m) => (
          <Card key={m.label} style={{ width: "47%", flexGrow: 1 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</Text>
            <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800", marginTop: 6 }}>{m.value}</Text>
          </Card>
        ))}
      </View>

      <Text style={{ color: colors.mutedForeground, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginTop: spacing.xs }}>
        Recent packages
      </Text>
      {isLoading ? (
        <Loading />
      ) : recent.length === 0 ? (
        <Card>
          <EmptyState icon="cube-outline" title="No shipments yet" hint="Create your first package to start tracking." />
        </Card>
      ) : (
        recent.map((p: PackageView) => (
          <Pressable key={p.id} onPress={() => router.push(`/package/${p.id}`)}>
            <Card style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontFamily: "monospace", color: colors.foreground, fontWeight: "700", flex: 1 }}>{p.trackingCode}</Text>
                <StatusBadge status={p.status} />
              </View>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>{p.recipientName}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {p.pickupCity} → {p.destinationCity} · {formatDate(p.createdAt)}
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
