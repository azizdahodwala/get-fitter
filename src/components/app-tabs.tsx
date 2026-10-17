// SDK 57 ships native tabs under the unstable entry point (renamed to 'expo-router/native-tabs' in SDK 58).
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();
  return (
    <NativeTabs
      backgroundColor={theme.card}
      tintColor={theme.accent}
      indicatorColor={theme.accentSoft}
      labelStyle={{ selected: { color: theme.accent } }}>
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Workouts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dumbbell.fill" md="fitness_center" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exercises" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.strengthtraining.traditional" md="sports_gymnastics" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md="history" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
