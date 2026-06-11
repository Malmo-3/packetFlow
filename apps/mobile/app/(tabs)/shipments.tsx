import { useState } from "react";
import { View, Text, RefreshControl, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import type { PackageStatus } from "@packetflow/types";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useAuth } from "../../src/context/AuthContext";
import { useSenderPackages } from "../../src/hooks/usePackages";
import { Screen, ScreenHeader, Card, Button, Input, Loading, EmptyState } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/StatusBadge";
import { formatDate } from "../../src/lib/format";
import { radius } from "../../src/theme/tokens";

const FILTERS: { id: "all" | PackageStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "registered", label: "Registered" },
  { id: "in_transit", label: "In Transit" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
];

export default function Shipments() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { data = [], isLoading, refetch, isRefetching } = useSenderPackages(user?.id);
  const [filter, setFilter] = useState<"all" | PackageStatus>("all");
  const [q, setQ] = useState("");

  const filtered = data.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      (q.length === 0 ||
        p.trackingCode.toLowerCase().includes(q.toLowerCase()) ||
        p.recipientName.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.foreground} />}>
      <ScreenHeader title="My shipments" subtitle={`${data.length} packages registered.`} />

      <Button label="Create package" icon="add" onPress={() => router.push("/(tabs)/create")} />

      <Input placeholder="Search code or recipient" value={q} onChangeText={setQ} autoCapitalize="none" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: radius.pill,
                borderWidth: 1,
                backgroundColor: active ? colors.secondary : "transparent",
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: active ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: "500" }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon="cube-outline" title="No packages match your filters" />
        </Card>
      ) : (
        filtered.map((p) => (
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
