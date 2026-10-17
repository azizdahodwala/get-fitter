import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileForm } from '@/components/profile-form';
import { Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { programFor } from '@/data/programs';
import { saveBodyMetric } from '@/db/repo';
import { useSettings } from '@/lib/settings';

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();

  return (
    <Screen contentStyle={{ paddingTop: insets.top + Spacing.four }}>
      <Text variant="largeTitle">Welcome to Get Fitter</Text>
      <Text color="textSecondary" style={{ marginTop: Spacing.two }}>
        A few quick questions so we can suggest a plan that suits you. Everything stays on this phone.
      </Text>
      <ProfileForm
        initial={settings}
        askWeight
        submitTitle="Get started"
        onSubmit={async (v) => {
          if (v.weightKg != null) {
            await saveBodyMetric(db, {
              measured_at: Date.now(),
              weight_kg: v.weightKg,
              body_fat: null,
              waist_cm: null,
              chest_cm: null,
              hips_cm: null,
              arm_cm: null,
            });
          }
          await update({
            level: v.level,
            unit: v.unit,
            birthYear: v.birthYear,
            heightCm: v.heightCm,
            restSeconds: programFor(v.level)?.restSeconds ?? settings.restSeconds,
          });
          router.replace('/');
        }}
      />
    </Screen>
  );
}
