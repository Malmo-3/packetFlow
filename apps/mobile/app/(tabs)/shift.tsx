import { useState } from "react";
import { View, Text, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BackendTrip } from "@packetflow/backend-client";
import { useTheme } from "../../src/theme/ThemeProvider";
import {
  useShift,
  useStartShift,
  useEndShift,
  useAcceptTrip,
  useCheckInTrip,
  useAdvanceTrip,
  useCheckOutTrip,
} from "../../src/hooks/useCarrier";
import { Screen, ScreenHeader, Card, Button, Badge, Loading, EmptyState } from "../../src/components/ui";
import { notify } from "../../src/lib/dialog";
import { spacing } from "../../src/theme/tokens";

const journeyOf = (t: BackendTrip) => [t.startCity, ...(t.stops ?? []), t.endCity];

const TRIP_STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

export default function ShiftScreen() {
  const { colors } = useTheme();
  const { data: shift, isLoading, refetch, isRefetching } = useShift();
  const startShift = useStartShift();
  const endShift = useEndShift();
  const accept = useAcceptTrip();
  const checkIn = useCheckInTrip();
  const advance = useAdvanceTrip();
  const checkOut = useCheckOutTrip();

  const onShift = shift?.onShift ?? false;
  const trip = shift?.trip ?? null;

  const fail = (e: unknown, fallback: string) =>
    notify("Action failed", e instanceof Error ? e.message : fallback);

  const run = (mutate: { mutateAsync: (a: any) => Promise<any> }, arg: any, errMsg: string) =>
    mutate.mutateAsync(arg).catch((e) => fail(e, errMsg));

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.foreground} />}>
      <ScreenHeader title="Your shift" subtitle={onShift ? "You are on duty" : "Start a shift to begin deliveries"} />

      {/* Shift control */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: onShift ? colors.success : colors.secondary,
            }}
          >
            <Ionicons name={onShift ? "radio" : "power"} size={20} color={onShift ? "#fff" : colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
              {onShift ? "On shift" : "Off shift"}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              {onShift && shift?.shiftStartedAt
                ? `Started ${new Date(shift.shiftStartedAt).toLocaleTimeString()}`
                : "Clock in to receive and run trips"}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.md }}>
          {onShift ? (
            <Button
              label="End shift"
              variant="outline"
              icon="power"
              full
              loading={endShift.isPending}
              onPress={() =>
                run(endShift, undefined, "Finish your active trip before ending the shift.")
              }
            />
          ) : (
            <Button
              label="Start shift"
              icon="play"
              full
              loading={startShift.isPending}
              onPress={() => run(startShift, undefined, "Could not start shift.")}
            />
          )}
        </View>
      </Card>

      {isLoading ? (
        <Loading />
      ) : !trip ? (
        <Card>
          <EmptyState icon="map-outline" title="No trip assigned" hint="When an admin assigns you a trip, it will appear here." />
        </Card>
      ) : (
        <TripCard
          trip={trip}
          busy={accept.isPending || checkIn.isPending || advance.isPending || checkOut.isPending}
          onAccept={() => run(accept, trip._id, "Could not accept trip.")}
          onStart={() => run(checkIn, trip._id, "Could not start trip.")}
          onAdvance={() => run(advance, trip._id, "Could not advance.")}
          onEnd={() => run(checkOut, trip._id, "All packages must be delivered before ending the trip.")}
          canActOnShift={onShift}
        />
      )}
    </Screen>
  );
}

function TripCard({
  trip,
  busy,
  onAccept,
  onStart,
  onAdvance,
  onEnd,
  canActOnShift,
}: {
  trip: BackendTrip;
  busy: boolean;
  onAccept: () => void;
  onStart: () => void;
  onAdvance: () => void;
  onEnd: () => void;
  canActOnShift: boolean;
}) {
  const { colors } = useTheme();
  const journey = journeyOf(trip);
  const idx = trip.currentStopIndex ?? 0;
  const atDestination = idx >= journey.length - 1;

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18, flex: 1 }}>{trip.name}</Text>
        <Badge text={TRIP_STATUS_LABEL[trip.status] ?? trip.status} bg={colors.secondary} color={colors.foreground} />
      </View>

      {/* Journey progress */}
      <View style={{ gap: 0 }}>
        {journey.map((city, i) => {
          const done = i < idx;
          const current = i === idx;
          const dotColor = done ? colors.success : current ? colors.foreground : colors.border;
          return (
            <View key={`${city}-${i}`} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ alignItems: "center", width: 16 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dotColor, marginTop: 3 }} />
                {i < journey.length - 1 && (
                  <View style={{ width: 2, height: 26, backgroundColor: done ? colors.success : colors.border }} />
                )}
              </View>
              <View style={{ paddingBottom: 12 }}>
                <Text style={{ color: current ? colors.foreground : colors.mutedForeground, fontWeight: current ? "700" : "500", fontSize: 15 }}>
                  {city}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                  {i === 0 ? "Start" : i === journey.length - 1 ? "Destination" : "Stop"}
                  {current ? " · current" : done ? " · passed" : ""}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Actions by trip stage */}
      <View style={{ gap: 8 }}>
        {!canActOnShift && (
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Start your shift to act on this trip.</Text>
        )}
        {trip.status === "planned" && !trip.accepted && (
          <Button label="Accept trip" icon="checkmark-circle-outline" full disabled={!canActOnShift || busy} loading={busy} onPress={onAccept} />
        )}
        {trip.status === "planned" && trip.accepted && (
          <Button label="Start trip" icon="play" full disabled={!canActOnShift || busy} loading={busy} onPress={onStart} />
        )}
        {trip.status === "active" && (
          <>
            {!atDestination && (
              <Button label="Advance to next stop" icon="arrow-forward" full disabled={!canActOnShift || busy} loading={busy} onPress={onAdvance} />
            )}
            <Button
              label={atDestination ? "End trip" : "End trip (when delivered)"}
              variant={atDestination ? "primary" : "outline"}
              icon="flag-outline"
              full
              disabled={!canActOnShift || busy}
              onPress={onEnd}
            />
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              Scan packages as delivered from the Deliveries tab.
            </Text>
          </>
        )}
      </View>
    </Card>
  );
}
