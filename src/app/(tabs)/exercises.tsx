import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseBrowser } from '@/components/exercise-browser';
import { Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ExerciseBrowser
      inTab
      onPress={(e) => router.push({ pathname: '/exercise/[id]', params: { id: e.id } })}
      header={
        <View style={{ paddingTop: insets.top + Spacing.three }}>
          <Text variant="largeTitle">Library</Text>
        </View>
      }
    />
  );
}
