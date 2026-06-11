import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Logo } from "../../src/components/Logo";
import { Button, FieldLabel, Input } from "../../src/components/ui";
import { notify } from "../../src/lib/dialog";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      notify("Missing details", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      notify("Login failed", "Check your email and password and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ gap: 6 }}>
          <Logo height={38} />
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, marginTop: 12 }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 15, color: colors.mutedForeground }}>Sign in to your account</Text>
        </View>

        <View style={{ gap: 14 }}>
          <View>
            <FieldLabel>Email</FieldLabel>
            <Input
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View>
            <FieldLabel>Password</FieldLabel>
            <Input placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <Button label={loading ? "Signing in…" : "Sign in"} onPress={handleLogin} loading={loading} full />
        </View>

        <Link href="/(auth)/register" style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 14 }}>
          Don&apos;t have an account? <Text style={{ color: colors.foreground, fontWeight: "600" }}>Register</Text>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
