import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Logo } from "../../src/components/Logo";
import { radius, spacing } from "../../src/theme/tokens";

const STEPS = [
  { n: "01", title: "Register", sub: "Create an account" },
  { n: "02", title: "Send", sub: "Create a package" },
  { n: "03", title: "Track", sub: "Follow it live" },
] as const;

/**
 * Startup landing screen — mirrors the web login page's marketing panel.
 * The panel uses the inverted palette (foreground background / background ink),
 * exactly like the web `bg-foreground text-background` hero.
 */
export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Inverted palette so the panel reads as a bold dark (light theme) / light
  // (dark theme) surface, matching the web hero.
  const panel = colors.foreground;
  const ink = colors.background;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: panel }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: "space-between" }}>
        <View style={{ alignItems: "center", paddingTop: spacing.lg }}>
          <Logo height={52} color={ink} />
        </View>

        <View style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: ink, fontSize: 44, fontWeight: "800", lineHeight: 48, letterSpacing: -1 }}>
              Logistics that{"\n"}moves with you.
            </Text>
            <Text style={{ color: ink, opacity: 0.6, fontSize: 17 }}>
              Send your packages across Skåne today.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {STEPS.map((step) => (
              <View
                key={step.n}
                style={{ flex: 1, backgroundColor: `${ink}1A`, borderRadius: radius.md, padding: spacing.md }}
              >
                <Text style={{ color: ink, opacity: 0.4, fontFamily: "monospace", fontSize: 12, fontWeight: "700" }}>
                  {step.n}
                </Text>
                <Text style={{ color: ink, fontSize: 14, fontWeight: "600", marginTop: spacing.sm }}>{step.title}</Text>
                <Text style={{ color: ink, opacity: 0.5, fontSize: 12, marginTop: 2 }}>{step.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={({ pressed }) => ({
              backgroundColor: ink,
              borderRadius: radius.pill,
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: panel, fontWeight: "700", fontSize: 16 }}>Sign in</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/register")}
            style={({ pressed }) => ({
              borderRadius: radius.pill,
              paddingVertical: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: `${ink}40`,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: ink, fontWeight: "600", fontSize: 16 }}>Create account</Text>
          </Pressable>

          <Text style={{ color: ink, opacity: 0.4, fontSize: 12, textAlign: "center", marginTop: spacing.xs }}>
            © {new Date().getFullYear()} PacketFlow
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
