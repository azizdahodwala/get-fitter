import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';

import { ExerciseBrowser } from '@/components/exercise-browser';
import { Button } from '@/components/ui';
import { haptics } from '@/lib/dialogs';
import { resolvePick } from '@/lib/exercise-picker';
import { goBack } from '@/lib/nav';

export default function PickExerciseScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function done(ids: string[]) {
    resolvePick(ids);
    goBack();
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <Button title="Cancel" kind="ghost" size="sm" onPress={() => done([])} />,
          headerRight: () => (
            <Button
              title={selected.length ? `Add (${selected.length})` : 'Add'}
              kind="ghost"
              size="sm"
              disabled={!selected.length}
              onPress={() => done(selected)}
            />
          ),
        }}
      />
      <ExerciseBrowser
        selected={selectedSet}
        onPress={(e) => {
          haptics.tap();
          setSelected((cur) => (cur.includes(e.id) ? cur.filter((x) => x !== e.id) : [...cur, e.id]));
        }}
      />
    </>
  );
}
