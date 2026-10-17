import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

// Native tabs have no web tab bar, so the browser build uses the JavaScript tabs.
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Workouts', icon: 'dumbbell' },
  { name: 'exercises', title: 'Library', icon: 'library' },
  { name: 'history', title: 'History', icon: 'history' },
  { name: 'profile', title: 'Profile', icon: 'profile' },
];

export default function AppTabs() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarLabelStyle: { fontWeight: '600' },
      }}>
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} size={22} color={String(color)} /> }}
        />
      ))}
    </Tabs>
  );
}
