/**
 * DialogHost — renders queued notify/confirm requests as a themed in-app modal.
 * Mounted once at the app root (app/_layout.tsx).
 */
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { Button } from "./ui";
import { radius, spacing } from "../theme/tokens";
import { subscribe, dismiss, type DialogRequest } from "../lib/dialogStore";

export function DialogHost() {
  const { colors } = useTheme();
  const [queue, setQueue] = useState<DialogRequest[]>([]);

  useEffect(() => subscribe(setQueue), []);

  const current = queue[0];
  if (!current) return null;

  const close = () => dismiss(current.id);
  const handleConfirm = () => {
    close();
    current.onConfirm?.();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <Pressable
        onPress={current.isConfirm ? close : handleConfirm}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 24 }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>{current.title}</Text>
          {current.message ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>{current.message}</Text>
          ) : null}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: spacing.md }}>
            {current.isConfirm && <Button label={current.cancelLabel} variant="outline" onPress={close} />}
            <Button
              label={current.confirmLabel}
              variant={current.destructive ? "destructive" : "primary"}
              onPress={handleConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default DialogHost;
