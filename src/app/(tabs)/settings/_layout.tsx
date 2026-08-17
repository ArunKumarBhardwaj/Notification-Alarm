import { Stack } from 'expo-router/stack';
import { Colors, Font } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: Font.bold, fontSize: 20, color: colors.text },
        headerLargeTitle: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
