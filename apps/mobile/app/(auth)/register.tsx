import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Logo } from "../../src/components/Logo";
import { Button, FieldLabel, Input } from "../../src/components/ui";
import { submitCarrierApplication } from "../../src/api/carrierApplications";
import { notify } from "../../src/lib/dialog";
import { formatPlate, isSwedishPlate } from "@packetflow/types";
import { radius } from "../../src/theme/tokens";

const ROLES = [
  { id: "sender", label: "Sender" },
  { id: "recipient", label: "Recipient" },
  { id: "carrier", label: "Carrier" },
] as const;

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("sender");
  const [loading, setLoading] = useState(false);

  const isCarrier = role === "carrier";

  const handleSubmit = async () => {
    if (!fullName || !email || !password) {
      notify("Missing details", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      notify("Weak password", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isCarrier) {
        if (!phone.trim() || !vehicle.trim()) {
          notify("Missing details", "Phone and vehicle registration are required for carrier applications.");
          return;
        }
        if (!isSwedishPlate(vehicle)) {
          notify("Invalid registration", "Enter a valid Swedish reg. number, e.g. ABC 12D or ABC 123.");
          return;
        }
        await submitCarrierApplication({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          vehicle: vehicle.trim(),
          address: address.trim() || undefined,
        });
        notify(
          "Application submitted",
          "Thanks! An admin will review your carrier application. You'll be able to sign in once it's approved.",
        );
        router.replace("/(auth)/login");
      } else {
        await register({ fullName, email: email.trim().toLowerCase(), password, role });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      notify(isCarrier ? "Could not submit application" : "Registration failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 22 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <Logo height={38} />
            <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, marginTop: 12 }}>
              {isCarrier ? "Apply to drive" : "Create account"}
            </Text>
            <Text style={{ fontSize: 15, color: colors.mutedForeground }}>
              {isCarrier ? "Submit a carrier application for admin approval" : "Join PacketFlow"}
            </Text>
          </View>

          <View style={{ gap: 14 }}>
            <View>
              <FieldLabel>I am a…</FieldLabel>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ROLES.map((r) => {
                  const active = role === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setRole(r.id)}
                      style={{
                        flex: 1,
                        paddingVertical: 11,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        alignItems: "center",
                        backgroundColor: active ? colors.primary : colors.secondary,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontWeight: "600", fontSize: 14 }}>
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <FieldLabel>Full name</FieldLabel>
              <Input placeholder="Jane Doe" value={fullName} onChangeText={setFullName} />
            </View>
            <View>
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View>
              <FieldLabel>Password</FieldLabel>
              <Input placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            {isCarrier && (
              <>
                <View>
                  <FieldLabel>Phone</FieldLabel>
                  <Input placeholder="+46 70 123 45 67" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                <View>
                  <FieldLabel>Vehicle registration number</FieldLabel>
                  <Input
                    placeholder="ABC 12D"
                    value={vehicle}
                    onChangeText={(t) => setVehicle(formatPlate(t))}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={7}
                  />
                </View>
                <View>
                  <FieldLabel>Base address (optional)</FieldLabel>
                  <Input placeholder="Storgatan 12, 211 20 Malmö" value={address} onChangeText={setAddress} />
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                  Carrier accounts are reviewed by an admin. You can sign in once your application is approved.
                </Text>
              </>
            )}

            <Button
              label={loading ? (isCarrier ? "Submitting…" : "Creating account…") : isCarrier ? "Submit application" : "Create account"}
              onPress={handleSubmit}
              loading={loading}
              full
            />
          </View>

          <Link href="/(auth)/login" style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 14 }}>
            Already have an account? <Text style={{ color: colors.foreground, fontWeight: "600" }}>Sign in</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
