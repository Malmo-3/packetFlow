import { useEffect, useState } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { authApi } from "@packetflow/backend-client";
import { formatPlate, isSwedishPlate } from "@packetflow/types";
import { confirmAction, notify } from "../../src/lib/dialog";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Logo } from "../../src/components/Logo";
import { Screen, Card, Button, Row, Divider, Input, FieldLabel, Loading } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/StatusBadge";
import {
  useCarrierMe,
  useCarrierHistory,
  useUpdateCarrierProfile,
  useDeleteCarrierAccount,
} from "../../src/hooks/useCarrier";
import { usePackages } from "../../src/hooks/usePackages";
import { formatDate } from "../../src/lib/format";
import { radius, spacing } from "../../src/theme/tokens";

const ROLE_LABEL: Record<string, string> = {
  sender: "Sender",
  recipient: "Recipient",
  carrier: "Carrier",
  admin: "Admin",
};

const TRIP_STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

export default function ProfileScreen() {
  const { user, logout, patchUser } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isCarrier = user?.role === "carrier";

  const me = useCarrierMe(isCarrier);
  const carrierHistory = useCarrierHistory(isCarrier);
  const updateCarrier = useUpdateCarrierProfile();
  const deleteCarrier = useDeleteCarrierAccount();

  // Package history for sender/recipient.
  const { data: allPackages = [], isLoading: pkgsLoading } = usePackages();
  const myPackages =
    user?.role === "sender"
      ? allPackages.filter((p) => p.senderId === user.id)
      : user?.role === "recipient"
      ? allPackages.filter((p) => p.recipientEmail?.toLowerCase() === user.email.toLowerCase())
      : [];

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");

  useEffect(() => {
    if (!user) return;
    setFullName(me.data?.fullName ?? user.fullName ?? "");
    setPhone(me.data?.phone ?? "");
    setVehicle(me.data?.vehicle ?? "");
  }, [me.data, user]);

  if (!user) return null;

  const saveProfile = async () => {
    if (isCarrier && vehicle.trim() && !isSwedishPlate(vehicle)) {
      notify("Invalid registration", "Enter a valid Swedish reg. number, e.g. ABC 12D or ABC 123.");
      return;
    }
    setBusy(true);
    try {
      if (isCarrier) {
        await updateCarrier.mutateAsync({ fullName, phone, vehicle });
      } else {
        await authApi.updateProfile({ fullName });
      }
      await patchUser({ name: fullName });
      setEditing(false);
      notify("Profile updated");
    } catch (e) {
      notify("Update failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () =>
    confirmAction({
      title: "Delete account",
      message: "This permanently deletes your account. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        try {
          if (isCarrier) await deleteCarrier.mutateAsync();
          else await authApi.deleteAccount();
          await logout();
        } catch (e) {
          notify("Couldn't delete", e instanceof Error ? e.message : "Try again.");
        }
      },
    });

  const confirmLogout = () =>
    confirmAction({
      title: "Sign out",
      message: "Are you sure you want to sign out?",
      confirmLabel: "Sign out",
      destructive: true,
      onConfirm: () => logout(),
    });

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 10, paddingVertical: spacing.lg }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={isCarrier ? "car" : "person"} size={32} color={colors.primaryForeground} />
        </View>
        {isCarrier ? (
          <>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800", fontFamily: "monospace" }}>
              {me.data?.carrierId ?? "—"}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{user.fullName}</Text>
          </>
        ) : (
          <>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>{user.fullName}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{user.email}</Text>
          </>
        )}
        <View style={{ backgroundColor: colors.secondary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
            {ROLE_LABEL[user.role] ?? user.role}
          </Text>
        </View>
      </View>

      <Card>
        {isCarrier && <><Row label="Carrier ID" value={me.data?.carrierId ?? "—"} /><Divider /></>}
        <Row label="Email" value={user.email} />
        {isCarrier && (
          <>
            <Divider />
            <Row label="Phone" value={me.data?.phone ?? "—"} />
            <Divider />
            <Row label="Vehicle" value={me.data?.vehicle ?? "—"} />
          </>
        )}
      </Card>

      <Button label="Edit profile" variant="secondary" icon="create-outline" onPress={() => setEditing(true)} />

      {/* History */}
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {isCarrier ? "Session history" : "Package history"}
        </Text>

        {isCarrier ? (
          carrierHistory.isLoading ? (
            <Loading />
          ) : (carrierHistory.data ?? []).length === 0 ? (
            <Card><Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No trips yet.</Text></Card>
          ) : (
            (carrierHistory.data ?? []).map(({ trip, totalPackages, deliveredCount }) => (
              <Card key={trip._id} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", flex: 1 }}>{trip.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{TRIP_STATUS_LABEL[trip.status] ?? trip.status}</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{trip.startCity} → {trip.endCity}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                  {deliveredCount}/{totalPackages} delivered · {formatDate(trip.createdAt)}
                </Text>
              </Card>
            ))
          )
        ) : pkgsLoading ? (
          <Loading />
        ) : myPackages.length === 0 ? (
          <Card><Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No packages yet.</Text></Card>
        ) : (
          [...myPackages]
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
            .map((p) => (
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
      </View>

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={18} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "500" }}>
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </Text>
          </View>
          <Button label={theme === "dark" ? "Switch to light" : "Switch to dark"} variant="secondary" onPress={toggleTheme} />
        </View>
      </Card>

      <Button label="Sign out" variant="outline" icon="log-out-outline" full onPress={confirmLogout} />
      <Button label="Delete account" variant="destructive" icon="trash-outline" full onPress={confirmDelete} />

      <View style={{ alignItems: "center", marginTop: spacing.lg, opacity: 0.5 }}>
        <Logo height={24} />
      </View>

      {/* Edit profile modal */}
      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <Pressable onPress={() => setEditing(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
            <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18 }}>Edit profile</Text>
            <View>
              <FieldLabel>Full name</FieldLabel>
              <Input value={fullName} onChangeText={setFullName} />
            </View>
            {isCarrier && (
              <>
                <View>
                  <FieldLabel>Phone</FieldLabel>
                  <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                <View>
                  <FieldLabel>Vehicle registration number</FieldLabel>
                  <Input
                    value={vehicle}
                    onChangeText={(t) => setVehicle(formatPlate(t))}
                    placeholder="ABC 12D"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={7}
                  />
                </View>
              </>
            )}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: spacing.xs }}>
              <Button label="Cancel" variant="outline" onPress={() => setEditing(false)} />
              <Button label={busy ? "Saving…" : "Save"} loading={busy} onPress={saveProfile} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
