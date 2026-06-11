import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";

/** A tappable field that opens a modal list of options — the RN stand-in for a <select>. */
export function SelectField({
  value,
  options,
  placeholder = "Select…",
  onChange,
}: {
  value?: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.input,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 13,
        }}
      >
        <Text style={{ color: value ? colors.foreground : colors.mutedForeground, fontSize: 15 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              maxHeight: "70%",
              paddingBottom: spacing.xl,
            }}
          >
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{placeholder}</Text>
            </View>
            <ScrollView>
              {options.map((opt) => {
                const active = opt === value;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: spacing.lg,
                      paddingVertical: 14,
                    }}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: active ? "700" : "400" }}>{opt}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={colors.foreground} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default SelectField;
