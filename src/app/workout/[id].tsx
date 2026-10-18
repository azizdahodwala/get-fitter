import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Elapsed } from '@/components/elapsed';
import { RestTimer } from '@/components/rest-timer';
import { COL, SetRowView } from '@/components/set-row';
import { Button, Card, EmptyState, ExerciseThumb, Icon, IconButton, Row, Screen, Segmented, Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { displayName, equipmentLabel, getExercise, modeOptions, usesWeight, type TrackingMode } from '@/data/catalog';
import {
  addExercisesToWorkout,
  addSet,
  deleteSet,
  deleteWorkout,
  finishWorkout,
  getWorkout,
  removeWorkoutExercise,
  renameWorkout,
  setWorkoutExerciseMode,
  type SetRow,
  type SetValues,
  type WorkoutDetail,
  type WorkoutExerciseDetail,
} from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { confirm, haptics } from '@/lib/dialogs';
import { pickExercises } from '@/lib/exercise-picker';
import { formatDate, formatDuration, formatSpan, formatTime, formatVolume, formatWeight, type Unit } from '@/lib/format';
import { useSettings } from '@/lib/settings';
import { goBack } from '@/lib/nav';

function hasValues(s: SetValues) {
  return s.weight_kg != null || s.reps != null || s.seconds != null;
}

function workoutTotals(w: WorkoutDetail) {
  let done = 0;
  let total = 0;
  let volume = 0;
  for (const we of w.exercises) {
    for (const s of we.sets) {
      total++;
      if (!s.done) continue;
      done++;
      if (we.mode === 'weight' && s.weight_kg != null && s.reps) volume += s.weight_kg * s.reps;
    }
  }
  return { done, total, volume };
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const db = useSQLiteContext();
  const theme = useTheme();
  const { settings } = useSettings();
  const [workout, setWorkout] = useState<WorkoutDetail | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [rest, setRest] = useState<{ endAt: number; total: number } | null>(null);
  const [justFinished, setJustFinished] = useState(false);

  const load = useCallback(async () => {
    const w = await getWorkout(db, workoutId);
    setWorkout(w);
    if (w) setName(w.name);
  }, [db, workoutId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRestChange = useCallback((endAt: number | null, total?: number) => {
    setRest((cur) => (endAt == null ? null : { endAt, total: total ?? cur?.total ?? 0 }));
  }, []);

  if (workout === undefined) return null;
  if (workout === null) return <EmptyState icon="search" title="Workout not found" />;

  const w = workout;
  const live = w.finished_at == null;
  const unit = settings.unit;
  const totals = workoutTotals(w);

  const updateExercise = (weId: number, fn: (we: WorkoutExerciseDetail) => WorkoutExerciseDetail) =>
    setWorkout((cur) => cur && { ...cur, exercises: cur.exercises.map((we) => (we.id === weId ? fn(we) : we)) });

  async function addExercises() {
    const ids = await pickExercises();
    if (!ids.length) return;
    await addExercisesToWorkout(db, workoutId, ids);
    await load();
  }

  async function finish() {
    if (totals.done === 0) {
      const discard = await confirm({
        title: 'No sets checked off',
        message: 'Tick at least one set to save this workout. Discard it instead?',
        confirmText: 'Discard',
        destructive: true,
      });
      if (discard) {
        await deleteWorkout(db, workoutId);
        goBack();
      }
      return;
    }
    const unchecked = totals.total - totals.done;
    if (unchecked > 0) {
      const ok = await confirm({
        title: 'Finish workout?',
        message: `${unchecked} unchecked set${unchecked === 1 ? '' : 's'} will be removed.`,
        confirmText: 'Finish',
      });
      if (!ok) return;
    }
    await finishWorkout(db, workoutId);
    haptics.success();
    setRest(null);
    setJustFinished(true);
    await load();
  }

  async function remove() {
    const ok = await confirm({
      title: live ? 'Discard workout?' : 'Delete workout?',
      message: live ? 'Everything logged in this workout will be lost.' : 'It will be removed from your history.',
      confirmText: live ? 'Discard' : 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deleteWorkout(db, workoutId);
    goBack();
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: live ? '' : formatDate(w.started_at),
          headerRight: live ? () => <Button title="Finish" size="sm" onPress={finish} /> : undefined,
        }}
      />
      <Screen automaticallyAdjustKeyboardInsets contentStyle={{ paddingBottom: 140 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={() => name.trim() && renameWorkout(db, workoutId, name.trim())}
          style={[styles.name, { color: theme.text }]}
          accessibilityLabel="Workout name"
        />

        {live ? (
          <Row gap={Spacing.three} style={{ marginBottom: Spacing.three }}>
            <Row gap={6}>
              <Icon name="timer" size={16} color="accent" />
              <Elapsed since={w.started_at} color="accent" />
            </Row>
            <Text variant="caption">
              {totals.done}/{totals.total} sets
              {totals.volume ? ` · ${formatVolume(totals.volume, unit)}` : ''}
            </Text>
          </Row>
        ) : (
          <Card style={[styles.summary, justFinished && { borderColor: theme.success, borderWidth: 1.5 }]}>
            {justFinished ? (
              <Row gap={6}>
                <Icon name="trophy" size={16} color="success" />
                <Text variant="label" color="success">
                  Workout complete — nice work!
                </Text>
              </Row>
            ) : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <Stat label="Duration" value={formatSpan((w.finished_at ?? w.started_at) - w.started_at)} />
              <Stat label="Sets" value={String(totals.done)} />
              <Stat label="Volume" value={totals.volume ? formatVolume(totals.volume, unit) : '—'} />
            </Row>
            <Text variant="caption">
              {formatDate(w.started_at, { year: 'numeric' })} · {formatTime(w.started_at)}
            </Text>
          </Card>
        )}

        {w.exercises.map((we) => (
          <ExerciseBlock
            key={we.id}
            we={we}
            unit={unit}
            onSetChange={(s) => updateExercise(we.id, (x) => ({ ...x, sets: x.sets.map((y) => (y.id === s.id ? s : y)) }))}
            onSetDelete={async (setId) => {
              await deleteSet(db, setId);
              updateExercise(we.id, (x) => ({ ...x, sets: x.sets.filter((y) => y.id !== setId) }));
            }}
            onAddSet={async () => {
              const s = await addSet(db, we.id);
              updateExercise(we.id, (x) => ({ ...x, sets: [...x.sets, s] }));
            }}
            onMode={async (mode) => {
              await setWorkoutExerciseMode(db, we.id, we.exercise_id, mode);
              updateExercise(we.id, (x) => ({ ...x, mode }));
            }}
            onRemove={async () => {
              const ok = await confirm({
                title: `Remove ${displayName(getExercise(we.exercise_id))}?`,
                confirmText: 'Remove',
                destructive: true,
              });
              if (!ok) return;
              await removeWorkoutExercise(db, we.id);
              setWorkout((cur) => cur && { ...cur, exercises: cur.exercises.filter((x) => x.id !== we.id) });
            }}
            onCompleted={() => {
              if (live && settings.restSeconds > 0) {
                setRest({ endAt: Date.now() + settings.restSeconds * 1000, total: settings.restSeconds });
              }
            }}
          />
        ))}

        {!w.exercises.length ? (
          <EmptyState icon="dumbbell" title="No exercises yet" message="Add exercises from the library to start logging sets." />
        ) : null}

        <Button title="Add exercises" icon="add" kind="secondary" onPress={addExercises} style={{ marginTop: Spacing.two }} />
        {live ? <Button title="Finish workout" icon="check" size="lg" onPress={finish} style={{ marginTop: Spacing.three }} /> : null}
        <Button
          title={live ? 'Discard workout' : 'Delete workout'}
          icon="trash"
          kind="danger"
          onPress={remove}
          style={{ marginTop: Spacing.three }}
        />
      </Screen>
      {rest ? <RestTimer endAt={rest.endAt} total={rest.total} onChange={onRestChange} /> : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption">{label}</Text>
      <Text variant="heading">{value}</Text>
    </View>
  );
}

function ExerciseBlock({
  we,
  unit,
  onSetChange,
  onSetDelete,
  onAddSet,
  onMode,
  onRemove,
  onCompleted,
}: {
  we: WorkoutExerciseDetail;
  unit: Unit;
  onSetChange: (s: SetRow) => void;
  onSetDelete: (setId: number) => void;
  onAddSet: () => void;
  onMode: (mode: TrackingMode) => void;
  onRemove: () => void;
  onCompleted: () => void;
}) {
  const ex = getExercise(we.exercise_id);
  // On bodyweight moves the weight column is load added on top of you.
  const plus = usesWeight(ex) ? '' : '+';
  const weightHeader = `${plus}${unit.toUpperCase()}`;
  const planned =
    we.mode === 'weight' && we.target_weight_kg != null ? `${plus}${formatWeight(we.target_weight_kg, unit)} ${unit}` : null;
  let target: string | null = null;
  if (we.target_seconds) target = `${formatDuration(we.target_seconds)} per set`;
  else if (we.target_reps) target = planned ? `${planned} × ${we.target_reps} reps` : `${we.target_reps} reps per set`;
  else if (planned) target = `${planned} per set`;

  // Placeholder for each row: last session's matching set, else the row above, else the routine target.
  const hints: (SetValues | null)[] = [];
  we.sets.forEach((s, i) => {
    const above = i > 0 ? we.sets[i - 1] : null;
    hints.push(
      we.previous[i] ??
        (above && hasValues(above) ? above : (hints[i - 1] ?? null)) ??
        (target ? { weight_kg: we.target_weight_kg, reps: we.target_reps, seconds: we.target_seconds } : null),
    );
  });

  return (
    <Card style={styles.block}>
      <Row>
        <Pressable
          onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: we.exercise_id } })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 }}
          accessibilityRole="link">
          <ExerciseThumb id={we.exercise_id} size={44} />
          <View style={{ flex: 1 }}>
            <Text variant="label" color="accent" numberOfLines={2}>
              {displayName(ex)}
            </Text>
            <Text variant="caption" numberOfLines={2}>
              {[equipmentLabel(ex), target && `Target ${target}`].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </Pressable>
        <IconButton icon="trash" label="Remove exercise" onPress={onRemove} />
      </Row>
      <Segmented size="sm" options={modeOptions(ex)} value={we.mode} onChange={onMode} />

      <View style={styles.headerRow}>
        <Text variant="caption" style={{ width: COL.set, textAlign: 'center' }}>
          SET
        </Text>
        <Text variant="caption" style={{ flex: 1, textAlign: 'center' }}>
          PREVIOUS
        </Text>
        {we.mode === 'weight' ? (
          <Text variant="caption" style={{ width: COL.value, textAlign: 'center' }}>
            {weightHeader}
          </Text>
        ) : null}
        <Text variant="caption" style={{ width: COL.value, textAlign: 'center' }}>
          {we.mode === 'time' ? 'TIME' : 'REPS'}
        </Text>
        <View style={{ width: COL.check }} />
      </View>
      {we.sets.map((s, i) => (
        <SetRowView
          key={`${s.id}-${we.mode}`}
          set={s}
          index={i}
          mode={we.mode}
          unit={unit}
          hint={hints[i]}
          previous={we.previous[i]}
          onChange={onSetChange}
          onDelete={() => onSetDelete(s.id)}
          onCompleted={onCompleted}
        />
      ))}
      <Button title="Add set" icon="add" kind="ghost" size="sm" onPress={onAddSet} />
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 26, fontWeight: '800', paddingVertical: Spacing.two, marginTop: Spacing.one },
  summary: { gap: Spacing.three, marginBottom: Spacing.three },
  block: { gap: Spacing.two, marginBottom: Spacing.three, paddingHorizontal: Spacing.two },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, borderRadius: Radius.sm },
});
