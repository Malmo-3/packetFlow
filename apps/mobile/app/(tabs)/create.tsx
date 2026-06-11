import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { SKANE_CITIES, DROP_OFF_POINTS } from "@packetflow/types";
import type { SkaneCity } from "@packetflow/types";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useAuth } from "../../src/context/AuthContext";
import { useCreatePackage } from "../../src/hooks/usePackages";
import { Screen, ScreenHeader, Card, Button, Input, FieldLabel } from "../../src/components/ui";
import { SelectField } from "../../src/components/SelectField";
import { notify } from "../../src/lib/dialog";
import { spacing } from "../../src/theme/tokens";

export default function CreatePackage() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const createPackage = useCreatePackage();

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [pickupCity, setPickupCity] = useState<SkaneCity | "">("");
  const [destinationCity, setDestinationCity] = useState<SkaneCity | "">("");
  const [weightKg, setWeightKg] = useState("1");
  const [length, setLength] = useState("10");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const dropOffPoint = pickupCity ? DROP_OFF_POINTS[pickupCity] : null;
  const pickUpPoint = destinationCity ? DROP_OFF_POINTS[destinationCity] : null;

  const submit = async () => {
    setError(null);
    const w = Number(weightKg);
    const l = Number(length);
    const wi = Number(width);
    const h = Number(height);
    if (!user) return setError("You must be signed in as a sender.");
    if (!recipientName.trim()) return setError("Enter the recipient's name.");
    if (!recipientEmail.trim()) return setError("Enter the recipient's email address.");
    if (!pickupCity) return setError("Select a pickup city.");
    if (!destinationCity) return setError("Select a destination city.");
    if ([w, l, wi, h].some((v) => Number.isNaN(v) || v <= 0)) return setError("Weight and dimensions must be positive numbers.");

    try {
      const created = await createPackage.mutateAsync({
        senderName: user.fullName,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientPhone: recipientPhone.trim() || undefined,
        recipientAddress: recipientAddress.trim() || undefined,
        pickupCity,
        destinationCity,
        weight: Number(w.toFixed(2)),
        dimensions: { length: l, width: wi, height: h },
      });
      notify("Package created", `Tracking code: ${created.trackingCode}`);
      router.replace(`/package/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create package.");
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Create shipment" subtitle="Register a package and generate a tracking number." />

      <Card style={{ gap: spacing.md }}>
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>Recipient</Text>
        <View>
          <FieldLabel>Recipient name</FieldLabel>
          <Input placeholder="Jane Doe" value={recipientName} onChangeText={setRecipientName} />
        </View>
        <View>
          <FieldLabel>Email address *</FieldLabel>
          <Input placeholder="name@example.com" value={recipientEmail} onChangeText={setRecipientEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>
        <View>
          <FieldLabel>Phone (optional)</FieldLabel>
          <Input placeholder="+46 70 123 45 67" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
        </View>
        <View>
          <FieldLabel>Address (optional)</FieldLabel>
          <Input placeholder="Storgatan 12, 211 20 Malmö" value={recipientAddress} onChangeText={setRecipientAddress} />
        </View>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>Route</Text>
        <View>
          <FieldLabel>Origin city</FieldLabel>
          <SelectField value={pickupCity} options={SKANE_CITIES} placeholder="Select a Skåne city…" onChange={(v) => setPickupCity(v as SkaneCity)} />
        </View>
        <View>
          <FieldLabel>Destination city</FieldLabel>
          <SelectField value={destinationCity} options={SKANE_CITIES} placeholder="Select a Skåne city…" onChange={(v) => setDestinationCity(v as SkaneCity)} />
        </View>
        {dropOffPoint ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12 }}>
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>Drop-off point</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{dropOffPoint}</Text>
          </View>
        ) : null}
        {pickUpPoint ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12 }}>
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>Pick-up point</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{pickUpPoint}</Text>
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>Shipment details</Text>
        <View>
          <FieldLabel>Weight (kg)</FieldLabel>
          <Input value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel>L (cm)</FieldLabel>
            <Input value={length} onChangeText={setLength} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>W (cm)</FieldLabel>
            <Input value={width} onChangeText={setWidth} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>H (cm)</FieldLabel>
            <Input value={height} onChangeText={setHeight} keyboardType="number-pad" />
          </View>
        </View>
      </Card>

      {error ? (
        <Text style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text>
      ) : null}

      <Button label={createPackage.isPending ? "Creating…" : "Create shipment"} icon="add" full loading={createPackage.isPending} onPress={submit} />
    </Screen>
  );
}
