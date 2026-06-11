/**
 * Shared mobile UI primitives, themed to match the web app's design system
 * (black/white duet, pill buttons, hairline borders, card surfaces).
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";

/** Full-screen container with safe-area padding and themed background. */
export function Screen({
  children,
  scroll = true,
  refreshControl,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<any>;
  contentStyle?: ViewStyle;
}) {
  const { colors } = useTheme();
  const inner = (
    <View style={[{ padding: spacing.lg, gap: spacing.lg }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
  const { colors } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.primaryForeground, border: colors.primary },
    secondary: { bg: colors.secondary, fg: colors.foreground, border: colors.secondary },
    outline: { bg: "transparent", fg: colors.foreground, border: colors.border },
    ghost: { bg: "transparent", fg: colors.foreground, border: "transparent" },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground, border: colors.destructive },
  };
  const p = palette[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: p.bg,
        borderColor: p.border,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingVertical: 13,
        paddingHorizontal: 20,
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        alignSelf: full ? "stretch" : "flex-start",
      })}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={p.fg} />
      ) : null}
      <Text style={{ color: p.fg, fontWeight: "600", fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

export function Input(props: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      {...props}
      style={[
        {
          backgroundColor: colors.input,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.foreground,
        },
        props.style as object,
      ]}
    />
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export function EmptyState({ icon = "cube-outline", title, hint }: { icon?: keyof typeof Ionicons.glyphMap; title: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", padding: spacing.xxl, gap: 8 }}>
      <Ionicons name={icon} size={32} color={colors.mutedForeground} />
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", textAlign: "center" }}>{title}</Text>
      {hint ? <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign: "center" }}>{hint}</Text> : null}
    </View>
  );
}

export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={{ padding: spacing.xxl, alignItems: "center" }}>
      <ActivityIndicator color={colors.foreground} />
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "500", maxWidth: "62%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}
