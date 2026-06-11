import { useQuery } from "@tanstack/react-query";
import { View, Text } from "react-native";
import type { Scan } from "@packetflow/types";
import type { PackageView } from "../api/packages";
import { getPackageTrip } from "../api/packages";
import { useTheme } from "../theme/ThemeProvider";
import { Card, Row, Divider } from "./ui";
import { StatusBadge } from "./StatusBadge";
import { TrackingMap } from "./TrackingMap";
import { formatDateTime } from "../lib/format";
import { spacing } from "../theme/tokens";

export function PackageTrackingView({ pkg, scans }: { pkg: PackageView; scans: Scan[] }) {
  const { colors } = useTheme();
  const ordered = [...scans].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));

  // The package's trip drives the live map: it carries the full list of stops
  // and the carrier's current position (advanced from the mobile app). Polled so
  // the marker moves as the carrier makes stops.
  const { data: trip } = useQuery({
    queryKey: ["package", pkg.id, "trip"],
    queryFn: ({ signal }) => getPackageTrip(pkg.id, signal),
    refetchInterval: 30_000,
  });
  const journey = trip ? [trip.startCity, ...(trip.stops ?? []), trip.endCity] : undefined;

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Map */}
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>Live map</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            {pkg.pickupCity} → {pkg.destinationCity}
          </Text>
        </View>
        <TrackingMap
          pickupCity={pkg.pickupCity}
          destinationCity={pkg.destinationCity}
          scans={scans}
          status={pkg.status}
          journey={journey}
          currentStopIndex={trip?.currentStopIndex ?? 0}
        />
        {journey ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {pkg.status === "delivered"
              ? "Delivered"
              : `Currently at ${journey[Math.min(trip?.currentStopIndex ?? 0, journey.length - 1)]}`}
          </Text>
        ) : null}
      </Card>

      {/* Journey */}
      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>Journey</Text>
        {ordered.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            No scans recorded yet. The package is registered and waiting for first checkpoint.
          </Text>
        ) : (
          ordered.map((scan, i) => (
            <View key={scan.id} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ alignItems: "center", width: 14 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.foreground, marginTop: 3 }} />
                {i < ordered.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginTop: 2 }} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 12 }}>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>{scan.checkpointName || "Checkpoint"}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{formatDateTime(scan.timestamp)}</Text>
              </View>
              <StatusBadge status={scan.status} />
            </View>
          ))
        )}
      </Card>

      {/* Details */}
      <Card>
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16, marginBottom: 4 }}>Details</Text>
        <Row label="Weight" value={`${pkg.weightKg} kg`} />
        <Divider />
        <Row label="Dimensions" value={`${pkg.dimensions.length} × ${pkg.dimensions.width} × ${pkg.dimensions.height} cm`} />
        <Divider />
        <Row label="Recipient" value={pkg.recipientName} />
        <Divider />
        <Row label="Carrier" value={trip?.assignedCarrierCode ?? "Awaiting assignment"} />
        <Divider />
        <Row label="Drop-off" value={pkg.dropOffPoint || "—"} />
      </Card>
    </View>
  );
}

export default PackageTrackingView;
