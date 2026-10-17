import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';

import { DATABASE_NAME, migrateDb } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { SettingsProvider } from '@/lib/settings';

// Hidden by SettingsProvider once the database and settings are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDb}>
        <SettingsProvider>
          <Stack
            screenOptions={{
              headerTintColor: theme.accent,
              headerTitleStyle: { color: theme.text },
              headerStyle: { backgroundColor: theme.background },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: theme.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="exercise/[id]" options={{ title: '' }} />
            <Stack.Screen name="routine/[id]" options={{ title: 'Routine' }} />
            <Stack.Screen name="routine/edit" options={{ title: 'Edit Routine', presentation: 'modal' }} />
            <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
            <Stack.Screen name="pick-exercise" options={{ title: 'Add Exercises', presentation: 'modal' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="plan" options={{ title: 'Training Plan' }} />
            <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile' }} />
            <Stack.Screen name="body/index" options={{ title: 'Body' }} />
            <Stack.Screen name="body/log" options={{ title: 'Log Measurements', presentation: 'modal' }} />
          </Stack>
        </SettingsProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
