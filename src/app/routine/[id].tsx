import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { ExerciseRow } from '@/components/exercise-browser';
import { Button, Card, EmptyState, Row, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getExercise, usesWeight, type TrackingMode } from '@/data/catalog';
import {
  deleteRoutine,
  duplicateRoutine,
  getRoutine,
  itemMode,
  modePrefs,
  type Routine,
  type RoutineItem,
} from '@/db/repo';
import { confirm } from '@/lib/dialogs';
import { formatDuration, formatWeight, type Unit } from '@/lib/format';
import { useSettings } from '@/lib/settings';
import { startWorkoutFlow } from '@/lib/workout-flow';
import { goBack } from '@/lib/nav';

export function targetLabel(it: Pick<RoutineItem, 'sets' | 'reps' | 'seconds'>) {
  const per = it.seconds ? formatDuration(it.seconds) : it.reps ? `${it.reps} reps` : 'reps';
  return `${it.sets} × ${per}`;
}

/** What each set is loaded with: the planned weight, or how the exercise is done. */
function loadLabel(it: RoutineItem, mode: TrackingMode, unit: Unit) {
  if (mode === 'time') return null;
  const weighted = usesWeight(getExercise(it.exercise_id));
  if (mode === 'reps') return weighted ? 'Reps only' : 'Bodyweight';
  if (it.weight_kg == null) return weighted ? 'Weighted' : 'Bodyweight + weight';
  return `${weighted ? '' : '+'}${formatWeight(it.weight_kg, unit)} ${unit}`;
}

export default function RoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [data, setData] = useState<
    { routine: Routine; items: RoutineItem[]; prefs: Map<string, TrackingMode> } | null | undefined
  >(undefined);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      Promise.all([getRoutine(db, routineId), modePrefs(db)]).then(([r, prefs]) => live && setData(r && { ...r, prefs }));
      return () => {
        live = false;
      };
    }, [db, routineId]),
  );

  if (data === undefined) return null;
  if (data === null) return <EmptyState icon="search" title="Routine not found" />;
  const { routine, items, prefs } = data;
  const modes = items.map((it) => itemMode(it, prefs));
  const unplanned = items.some((it, i) => modes[i] === 'weight' && it.weight_kg == null);

  async function onDuplicate() {
    const newId = await duplicateRoutine(db, routineId);
    if (newId) router.replace({ pathname: '/routine/edit', params: { id: String(newId) } });
  }

  async function onDelete() {
    const ok = await confirm({
      title: `Delete "${routine.name}"?`,
      message: 'Past workouts from this routine stay in your history.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deleteRoutine(db, routineId);
    goBack();
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Button
              title="Edit"
              kind="ghost"
              size="sm"
              onPress={() => router.push({ pathname: '/routine/edit', params: { id: String(routineId) } })}
            />
          ),
        }}
      />
      <Text variant="title">{routine.name}</Text>
      {routine.notes ? (
        <Text variant="body" color="textSecondary" style={{ marginTop: Spacing.one }}>
          {routine.notes}
        </Text>
      ) : null}

      <Button
        title="Start workout"
        icon="play"
        size="lg"
        style={{ marginVertical: Spacing.four }}
        disabled={!items.length}
        onPress={() => startWorkoutFlow(db, routineId)}
      />

      <Card style={{ paddingVertical: Spacing.one }}>
        {items.length ? (
          items.map((it, i) => {
            const ex = getExercise(it.exercise_id);
            const load = loadLabel(it, modes[i], settings.unit);
            return ex ? (
              <ExerciseRow
                key={it.id}
                exercise={ex}
                onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: ex.id } })}
                right={
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="label" color="textSecondary">
                      {targetLabel(it)}
                    </Text>
                    {load ? <Text variant="caption">{load}</Text> : null}
                  </View>
                }
              />
            ) : null;
          })
        ) : (
          <EmptyState icon="dumbbell" title="No exercises yet" message="Tap Edit to add some." />
        )}
      </Card>
      {unplanned ? (
        <Text variant="caption" style={{ marginTop: Spacing.two }}>
          Tap Edit to plan a weight for the weighted exercises. You log the weight you actually lift during the workout.
        </Text>
      ) : null}

      <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
        <Row gap={Spacing.two}>
          <Button title="Duplicate" icon="copy" kind="secondary" style={{ flex: 1 }} onPress={onDuplicate} />
          <Button title="Delete" icon="trash" kind="secondary" style={{ flex: 1 }} onPress={onDelete} />
        </Row>
        {routine.starter_key ? (
          <Text variant="caption" style={{ textAlign: 'center' }}>
            Starter routine — duplicate it to make your own version, or edit it directly.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
