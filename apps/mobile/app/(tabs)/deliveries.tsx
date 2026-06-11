import { View, Text, RefreshControl } from "react-native";
import type { BackendPackage } from "@packetflow/backend-client";
import type { PackageStatus } from "@packetflow/types";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useShift, useTripPackages, useScanPackage } from "../../src/hooks/useCarrier";
import { Screen, ScreenHeader, Card, Button, Badge, Loading, EmptyState } from "../../src/components/ui";
import { confirmAction, notify } from "../../src/lib/dialog";
import { StatusBadge } from "../../src/components/StatusBadge";
import { statusStyles } from "../../src/theme/tokens";
import { spacing } from "../../src/theme/tokens";

export default function DeliveriesScreen() {
  const { colors, theme } = useTheme();
  const { data: shift, isLoading: shiftLoading } = useShift();
  const trip = shift?.trip ?? null;
  const tripId = trip?._id;
  const { data: packages = [], isLoading, refetch, isRefetching } = useTripPackages(tripId);
  const scan = useScanPackage();

  const confirmScan = (pkg: BackendPackage) => {
    confirmAction({
      title: "Scan delivered",
      message: `Mark ${pkg.trackingNumber} as delivered to ${pkg.recipientName}?`,
      confirmLabel: "Confirm",
      onConfirm: () =>
        scan
          .mutateAsync({ tripId: tripId!, packageId: pkg._id, scanCode: pkg.trackingNumber })
          .then(() => refetch())
          .catch((e) =>
            notify("Scan failed", e instanceof Error ? e.message : "Start the trip before scanning."),
          ),
    });
  };

  if (shiftLoading || isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Deliveries" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.foreground} />}>
      <ScreenHeader
        title="Deliveries"
        subtitle={trip ? `${packages.length} package${packages.length !== 1 ? "s" : ""} on ${trip.name}` : "No active trip"}
      />

      {!trip ? (
        <Card>
          <EmptyState icon="cube-outline" title="No trip assigned" hint="Accept and start a trip from the Shift tab." />
        </Card>
      ) : packages.length === 0 ? (
        <Card>
          <EmptyState icon="cube-outline" title="No packages on this trip" />
        </Card>
      ) : (
        packages.map((p) => {
          const status = p.status as PackageStatus;
          const delivered = status === "delivered";
          const s = statusStyles[theme][delivered ? "delivered" : "in_transit"];
          return (
            <Card key={p._id} style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={{ fontFamily: "monospace", fontWeight: "700", color: colors.foreground, flex: 1 }}>
                  {p.trackingNumber}
                </Text>
                {delivered ? <StatusBadge status="delivered" /> : <Badge text="On trip" bg={s.bg} color={s.text} />}
              </View>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}>{p.recipientName}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{p.recipientEmail}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                {p.pickupCity} → {p.destinationCity}
              </Text>
              {p.dropOffPoint ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Drop-off: {p.dropOffPoint}</Text>
              ) : null}
              <View style={{ marginTop: spacing.xs }}>
                {delivered ? (
                  <Text style={{ color: colors.success, fontWeight: "600" }}>✓ Delivered</Text>
                ) : (
                  <Button
                    label="Scan delivered"
                    icon="qr-code-outline"
                    disabled={trip.status !== "active" || scan.isPending}
                    onPress={() => confirmScan(p)}
                  />
                )}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
