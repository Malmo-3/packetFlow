import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useNotifications } from "../../src/hooks/useNotifications";

type Role = "sender" | "recipient" | "carrier" | "admin";

// Which tabs each role sees, in order. Tabs not listed are hidden (href: null).
const ROLE_TABS: Record<Role, string[]> = {
  sender: ["home", "create", "shipments", "notifications", "profile"],
  recipient: ["saved", "track", "notifications", "profile"],
  carrier: ["shift", "deliveries", "notifications", "profile"],
  admin: ["notifications", "profile"],
};

const ALL_TABS = [
  "home",
  "create",
  "shipments",
  "saved",
  "track",
  "shift",
  "deliveries",
  "notifications",
  "profile",
  "packages", // legacy route — always hidden, redirects to the role home
] as const;

const META: Record<string, { title: string; icon: keyof typeof Ionicons.glyphMap }> = {
  home: { title: "Overview", icon: "grid-outline" },
  create: { title: "Create", icon: "add-circle-outline" },
  shipments: { title: "Shipments", icon: "cube-outline" },
  saved: { title: "Saved", icon: "star-outline" },
  track: { title: "Track", icon: "navigate-outline" },
  shift: { title: "Shift", icon: "car-outline" },
  deliveries: { title: "Deliveries", icon: "cube-outline" },
  notifications: { title: "Alerts", icon: "notifications-outline" },
  profile: { title: "Profile", icon: "person-outline" },
  packages: { title: "Packages", icon: "cube-outline" },
};

export default function TabsLayout() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { data: notif } = useNotifications();
  const unread = notif?.unreadCount ?? 0;

  const role = (user?.role ?? "recipient") as Role;
  const visible = new Set(ROLE_TABS[role] ?? ROLE_TABS.recipient);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {ALL_TABS.map((name) => {
        const meta = META[name];
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: meta.title,
              href: visible.has(name) ? undefined : null,
              tabBarBadge: name === "notifications" && unread > 0 ? (unread > 9 ? "9+" : unread) : undefined,
              tabBarIcon: ({ color, size }) => <Ionicons name={meta.icon} size={size} color={color} />,
            }}
          />
        );
      })}
    </Tabs>
  );
}
