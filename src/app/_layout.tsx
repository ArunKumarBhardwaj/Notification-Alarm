import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import "react-native-reanimated";

import { AlarmOverlay } from "@/components/AlarmOverlay";
import { AppDialogOverlay } from "@/components/AppDialogOverlay";
import { Colors, Font } from "@/constants/theme";
import { AlarmProvider } from "@/hooks/alarm-provider";
import { DialogProvider } from "@/hooks/dialog-provider";
import { useColorScheme } from "@/hooks/use-color-scheme";

const isStoreRelease = !__DEV__ && Updates.channel === "production";

Sentry.init({
  dsn: 'https://7b48da253dc2760b325dbae1a40a85aa@o4511955040468992.ingest.us.sentry.io/4511955048923136',
  tracesSampleRate: isStoreRelease ? 0.2 : 1.0,
  _experiments: {
    profilesSampleRate: isStoreRelease ? 0.1 : 1.0,
  },
});

export const unstable_settings = {
  anchor: "index",
};

SplashScreen.setOptions({ fade: true, duration: 300 });
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme === "dark" ? "dark" : "light"];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.background);
  }, [palette.background]);

  useEffect(() => {
    // Fonts are embedded at build time, so hide after the first paint.
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const navigationTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: palette.tint,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.border,
      notification: palette.danger,
    },
    fonts: {
      regular: { fontFamily: Font.regular, fontWeight: "400" as const },
      medium: { fontFamily: Font.medium, fontWeight: "400" as const },
      bold: { fontFamily: Font.bold, fontWeight: "400" as const },
      heavy: { fontFamily: Font.extrabold, fontWeight: "400" as const },
    },
  };

  return (
    <DialogProvider>
      <AlarmProvider>
        <ThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="onboarding"
              options={{ animation: "fade", gestureEnabled: false }}
            />
            <Stack.Screen
              name="setup"
              options={{ animation: "fade", gestureEnabled: false }}
            />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <AlarmOverlay />
          <AppDialogOverlay />
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </AlarmProvider>
    </DialogProvider>
  );
}

export default Sentry.wrap(RootLayout);
