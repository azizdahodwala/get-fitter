import { ProfileForm } from '@/components/profile-form';
import { Screen } from '@/components/ui';
import { programFor } from '@/data/programs';
import { useSettings } from '@/lib/settings';
import { goBack } from '@/lib/nav';

export default function EditProfileScreen() {
  const { settings, update } = useSettings();
  return (
    <Screen>
      <ProfileForm
        initial={settings}
        submitTitle="Save"
        onSubmit={async (v) => {
          await update({
            level: v.level,
            unit: v.unit,
            birthYear: v.birthYear,
            heightCm: v.heightCm,
            // A new level brings its own rest time; keep a custom one otherwise.
            ...(v.level !== settings.level ? { restSeconds: programFor(v.level)?.restSeconds ?? settings.restSeconds } : {}),
          });
          goBack();
        }}
      />
    </Screen>
  );
}
