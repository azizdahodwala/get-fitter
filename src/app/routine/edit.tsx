import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Button, Card, ExerciseThumb, IconButton, Row, Screen, SectionHeader, Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { displayName, getExercise, type TrackingMode } from '@/data/catalog';
import { getRoutine, modeFor, saveRoutine, type RoutineItemInput } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/dialogs';
import { pickExercises } from '@/lib/exercise-picker';
import { parseCount, parseDuration } from '@/lib/format';
import { goBack } from '@/lib/nav';

type DraftItem = RoutineItemInput & { key: string; mode: TrackingMode };

let keySeq = 0;
const nextKey = () => `k${keySeq++}`;

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routineId = id ? Number(id) : undefined;
  const db = useSQLiteContext();
  const theme = useTheme();
  const [loaded, setLoaded] = useState(!routineId);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!routineId) return;
    (async () => {
      const found = await getRoutine(db, routineId);
      if (found) {
        setName(found.routine.name);
        setNotes(found.routine.notes ?? '');
        const draft: DraftItem[] = [];
        for (const it of found.items) {
          draft.push({ ...it, key: nextKey(), mode: it.seconds ? 'time' : await modeFor(db, it.exercise_id) });
        }
        setItems(draft);
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
        mode,
      });
    }
    setItems((cur) => [...cur, ...added]);
  }

  const patch = (key: string, p: Partial<DraftItem>) =>
    setItems((cur) => cur.map((it) => (it.key === key ? { ...it, ...p } : it)));

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
        items: items.map(({ exercise_id, sets, reps, seconds }) => ({ exercise_id, sets, reps, seconds })),
      });
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
            <Row gap={Spacing.three}>
              <Row gap={4}>
                <Text variant="caption">Sets</Text>
                <IconButton icon="minus" label="Fewer sets" onPress={() => patch(it.key, { sets: Math.max(1, it.sets - 1) })} />
                <Text variant="label" style={{ minWidth: 18, textAlign: 'center' }}>
                  {it.sets}
                </Text>
                <IconButton icon="add" label="More sets" onPress={() => patch(it.key, { sets: Math.min(20, it.sets + 1) })} />
              </Row>
              <Row gap={6} style={{ flex: 1 }}>
                <Text variant="caption">{timed ? 'Seconds' : 'Reps'}</Text>
                <TextInput
                  defaultValue={String((timed ? it.seconds : it.reps) ?? '')}
                  onChangeText={(t) =>
                    patch(it.key, timed ? { seconds: parseDuration(t), reps: null } : { reps: parseCount(t), seconds: null })
                  }
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={theme.textSecondary}
                  style={[inputStyle, styles.small]}
                />
              </Row>
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
});

