import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/theme/ThemeProvider";
import { roleHome } from "../src/lib/nav";

export default function Index() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  return user ? <Redirect href={roleHome(user.role) as never} /> : <Redirect href="/(auth)/welcome" />;
}
