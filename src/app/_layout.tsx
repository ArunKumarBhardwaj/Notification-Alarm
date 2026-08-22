import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
import * as Sentry from "@sentry/react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import "react-native-reanimated";

import { AlarmOverlay } from "@/components/AlarmOverlay";
import { Colors, Font } from "@/constants/theme";
import { AlarmProvider } from "@/hooks/alarm-provider";
import { useColorScheme } from "@/hooks/use-color-scheme";

Sentry.init({
  dsn: 'https://7b48da253dc2760b325dbae1a40a85aa@o4511955040468992.ingest.us.sentry.io/4511955048923136',
  tracesSampleRate: 1.0,
  _experiments: {
    profilesSampleRate: 1.0,
  },
});

export const unstable_settings = {
  anchor: "index",
};

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 350 });

function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [fontsLoaded] = useFonts({
    [Font.regular]: PlusJakartaSans_400Regular,
    [Font.medium]: PlusJakartaSans_500Medium,
    [Font.semibold]: PlusJakartaSans_600SemiBold,
    [Font.bold]: PlusJakartaSans_700Bold,
    [Font.extrabold]: PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.background);
  }, [palette.background]);

  useEffect(() => {
    if (!fontsLoaded) return;
    // Let the navigator paint one frame first, so the splash fades into an
    // identical background instead of swapping colors mid-animation.
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, [fontsLoaded]);

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

  // The splash is still up until fonts resolve, so rendering nothing here just
  // avoids a first paint in the fallback font.
  if (!fontsLoaded) return null;

  return (
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
          <Stack.Screen name="(tabs)" />
        </Stack>
        <AlarmOverlay />
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </AlarmProvider>
  );
}

export default Sentry.wrap(RootLayout);
