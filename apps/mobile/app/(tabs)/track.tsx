import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import { getPackageByCode } from "../../src/api/packages";
import { Screen, ScreenHeader, Card, Button, Input, FieldLabel } from "../../src/components/ui";

/** Force the value to always carry the `PKT-` prefix; the user only edits the suffix. */
function withPktPrefix(input: string): string {
  const suffix = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^PKT/, "");
  return `PKT-${suffix}`;
}

export default function TrackScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [code, setCode] = useState("PKT-");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const pkg = await getPackageByCode(code);
      if (!pkg) {
        setError("No package found with this code.");
        return;
      }
      router.push(`/package/${pkg.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not look up that code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Track a package" subtitle="Enter the tracking code shared by the sender." />
      <Card style={{ gap: 14 }}>
        <View>
          <FieldLabel>Tracking code</FieldLabel>
          <Input
            placeholder="PKT-XXXXXXXX"
            value={code}
            onChangeText={(t) => { setCode(withPktPrefix(t)); setError(null); }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={submit}
          />
        </View>
        {error ? <Text style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text> : null}
        <Button label={busy ? "Looking up…" : "Track"} icon="navigate" full loading={busy} onPress={submit} />
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
          Codes start with PKT- followed by 8 characters — find yours in your confirmation email or ask the sender.
        </Text>
      </Card>
    </Screen>
  );
}
