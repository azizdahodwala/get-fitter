import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, ExerciseThumb, IconButton, Row, Screen, SectionHeader, Segmented, Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { displayName, getExercise, modeOptions, usesWeight, type TrackingMode } from '@/data/catalog';
import {
  getRoutine,
  itemMode,
  modeFor,
  modePrefs,
  saveRoutine,
  setExerciseMode,
  type RoutineItemInput,
} from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/dialogs';
import { pickExercises } from '@/lib/exercise-picker';
import { formatDuration, formatWeight, parseCount, parseDuration, parseWeight } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { useSettings } from '@/lib/settings';

type DraftItem = RoutineItemInput & { key: string; mode: TrackingMode };

let keySeq = 0;
const nextKey = () => `k${keySeq++}`;

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routineId = id ? Number(id) : undefined;
  const db = useSQLiteContext();
  const theme = useTheme();
  const { unit } = useSettings().settings;
  const [loaded, setLoaded] = useState(!routineId);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!routineId) return;
    (async () => {
      const [found, prefs] = await Promise.all([getRoutine(db, routineId), modePrefs(db)]);
      if (found) {
        setName(found.routine.name);
        setNotes(found.routine.notes ?? '');
        setItems(found.items.map((it) => ({ ...it, key: nextKey(), mode: itemMode(it, prefs) })));
      }
      setLoaded(true);
    })();
  }, [db, routineId]);

  async function addExercises() {
    const ids = await pickExercises();
    const added: DraftItem[] = [];
    for (const exerciseId of ids) {
      const mode = await modeFor(db, exerciseId);
      added.push({
        key: nextKey(),
        exercise_id: exerciseId,
        sets: 3,
        reps: mode === 'time' ? null : 10,
        seconds: mode === 'time' ? 30 : null,
        weight_kg: null,
        mode,
      });
    }
    setItems((cur) => [...cur, ...added]);
  }

  const patch = (key: string, p: Partial<DraftItem>) =>
    setItems((cur) => cur.map((it) => (it.key === key ? { ...it, ...p } : it)));

  // Switching mode keeps the targets that still make sense and fills in defaults.
  const changeMode = (it: DraftItem, mode: TrackingMode) =>
    patch(it.key, {
      mode,
      reps: mode === 'time' ? null : (it.reps ?? 10),
      seconds: mode === 'time' ? (it.seconds ?? 30) : null,
      weight_kg: mode === 'weight' ? it.weight_kg : null,
    });

  const move = (index: number, delta: number) =>
    setItems((cur) => {
      const next = [...cur];
      const [it] = next.splice(index, 1);
      next.splice(Math.max(0, Math.min(next.length, index + delta)), 0, it);
      return next;
    });

  async function save() {
    if (!name.trim()) return notify('Give your routine a name');
    setSaving(true);
    try {
      const savedId = await saveRoutine(db, {
        id: routineId,
        name: name.trim(),
        notes: notes.trim() || null,
        items: items.map(({ exercise_id, sets, reps, seconds, weight_kg }) => ({
          exercise_id,
          sets,
          reps,
          seconds,
          weight_kg,
        })),
      });
      // Remember the chosen mode so workouts log the exercise the same way.
      for (const it of items) await setExerciseMode(db, it.exercise_id, it.mode);
      if (routineId) goBack();
      else router.replace({ pathname: '/routine/[id]', params: { id: String(savedId) } });
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;
  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: routineId ? 'Edit Routine' : 'New Routine',
          headerLeft: () => <Button title="Cancel" kind="ghost" size="sm" onPress={() => goBack()} />,
          headerRight: () => <Button title="Save" kind="ghost" size="sm" loading={saving} onPress={save} />,
        }}
      />
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Routine name"
        placeholderTextColor={theme.textSecondary}
        style={[inputStyle, styles.nameInput]}
        autoFocus={!routineId}
      />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        placeholderTextColor={theme.textSecondary}
        style={[inputStyle, { marginTop: Spacing.two }]}
        multiline
      />

      <SectionHeader title={`Exercises (${items.length})`} />
      {items.map((it, index) => {
        const ex = getExercise(it.exercise_id);
        const timed = it.mode === 'time';
        const weighted = usesWeight(ex);
        return (
          <Card key={it.key} style={styles.item}>
            <Row>
              <ExerciseThumb id={it.exercise_id} size={44} />
              <Text variant="label" numberOfLines={2} style={{ flex: 1 }}>
                {displayName(ex)}
              </Text>
              <IconButton icon="up" label="Move up" onPress={() => move(index, -1)} />
              <IconButton icon="down" label="Move down" onPress={() => move(index, 1)} />
              <IconButton
                icon="trash"
                label="Remove"
                color="danger"
                onPress={() => setItems((cur) => cur.filter((x) => x.key !== it.key))}
              />
            </Row>
            <Segmented size="sm" options={modeOptions(ex)} value={it.mode} onChange={(m) => changeMode(it, m)} />
            <Row gap={Spacing.three} style={{ alignItems: 'flex-start' }}>
              <View style={styles.field}>
                <Text variant="caption">SETS</Text>
                <Row gap={2}>
                  <IconButton icon="minus" label="Fewer sets" onPress={() => patch(it.key, { sets: Math.max(1, it.sets - 1) })} />
                  <Text variant="label" style={{ minWidth: 18, textAlign: 'center' }}>
                    {it.sets}
                  </Text>
                  <IconButton icon="add" label="More sets" onPress={() => patch(it.key, { sets: Math.min(20, it.sets + 1) })} />
                </Row>
              </View>
              <View style={styles.field}>
                <Text variant="caption">{timed ? 'TIME' : 'REPS'}</Text>
                <TextInput
                  key={`${it.key}-${it.mode}`}
                  defaultValue={timed ? (it.seconds ? formatDuration(it.seconds) : '') : String(it.reps ?? '')}
                  onChangeText={(t) => patch(it.key, timed ? { seconds: parseDuration(t) } : { reps: parseCount(t) })}
                  keyboardType={timed ? 'numbers-and-punctuation' : 'number-pad'}
                  placeholder={timed ? '0:30' : '—'}
                  placeholderTextColor={theme.textSecondary}
                  selectTextOnFocus
                  style={[inputStyle, styles.small]}
                  accessibilityLabel={`${displayName(ex)} ${timed ? 'time' : 'reps'} per set`}
                />
              </View>
              {it.mode === 'weight' ? (
                <View style={styles.field}>
                  <Text variant="caption">{weighted ? unit.toUpperCase() : `+${unit.toUpperCase()}`}</Text>
                  <TextInput
                    defaultValue={formatWeight(it.weight_kg, unit)}
                    onChangeText={(t) => patch(it.key, { weight_kg: parseWeight(t, unit) })}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.textSecondary}
                    selectTextOnFocus
                    style={[inputStyle, styles.small]}
                    accessibilityLabel={`${displayName(ex)} weight in ${unit}`}
                  />
                </View>
              ) : null}
            </Row>
          </Card>
        );
      })}
      <Button title="Add exercises" icon="add" kind="secondary" onPress={addExercises} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  nameInput: { fontSize: 20, fontWeight: '700' },
  item: { gap: Spacing.two, marginBottom: Spacing.two },
  small: { width: 64, textAlign: 'center', paddingVertical: 6 },
  field: { gap: 4 },
});

