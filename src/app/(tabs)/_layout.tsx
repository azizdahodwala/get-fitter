import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useSettings } from '@/lib/settings';

export default function TabLayout() {
  const { settings } = useSettings();
  // First launch: ask for experience level (and optional body stats) before anything else.
  if (!settings.level) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
