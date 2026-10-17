import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { ProgressBars } from '@/components/progress-bars';
import { Button, Card, EmptyState, ExerciseThumb, Icon, Row, Screen, SectionHeader, Tag, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { displayName, getExercise, titleCase, youtubeSearchUrl, type TrackingMode } from '@/data/catalog';
import {
  addExercisesToWorkout,
  getActiveWorkout,
  getExerciseHistory,
  modeFor,
  type ExerciseSession,
  type SetValues,
  type Workout,
} from '@/db/repo';
import { haptics } from '@/lib/dialogs';
import { estimate1RM, formatDate, formatDuration, formatSet, formatWeight, type Unit } from '@/lib/format';
import { useSettings } from '@/lib/settings';
import { openWorkout } from '@/lib/workout-flow';

/** The headline number for a session in a given mode. */
function sessionBest(sets: SetValues[], mode: TrackingMode) {
  if (mode === 'time') return Math.max(0, ...sets.map((s) => s.seconds ?? 0));
  if (mode === 'reps') return Math.max(0, ...sets.map((s) => s.reps ?? 0));
  return Math.max(0, ...sets.map((s) => (s.weight_kg != null && s.reps ? estimate1RM(s.weight_kg, s.reps) : 0)));
}

function records(sessions: ExerciseSession[], mode: TrackingMode, unit: Unit) {
  const all = sessions.filter((s) => s.mode === mode).flatMap((s) => s.sets);
  if (!all.length) return [];
  if (mode === 'time') {
    return [{ label: 'Longest hold', value: formatDuration(Math.max(...all.map((s) => s.seconds ?? 0))) }];
  }
  const maxReps = Math.max(...all.map((s) => s.reps ?? 0));
  if (mode === 'reps') return [{ label: 'Most reps', value: String(maxReps) }];
  const heaviest = all.reduce((a, b) => ((b.weight_kg ?? 0) > (a.weight_kg ?? 0) ? b : a));
  const best1RM = Math.max(...all.map((s) => (s.weight_kg != null && s.reps ? estimate1RM(s.weight_kg, s.reps) : 0)));
  return [
    { label: 'Heaviest', value: `${formatWeight(heaviest.weight_kg ?? 0, unit)} ${unit} × ${heaviest.reps ?? 0}` },
    { label: 'Est. 1-rep max', value: `${formatWeight(best1RM, unit)} ${unit}` },
    { label: 'Most reps', value: String(maxReps) },
  ];
}

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const exercise = getExercise(id);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [mode, setMode] = useState<TrackingMode>('weight');
  const [active, setActive] = useState<Workout | null>(null);
  const [added, setAdded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        const [h, m, a] = await Promise.all([getExerciseHistory(db, id), modeFor(db, id), getActiveWorkout(db)]);
        if (!live) return;
        setSessions(h);
        // Show stats in the mode the user actually logs this exercise in.
        setMode(h[0]?.mode ?? m);
        setActive(a);
      })();
      return () => {
        live = false;
      };
    }, [db, id]),
  );

  if (!exercise) return <EmptyState icon="search" title="Exercise not found" />;

  const unit = settings.unit;
  const prs = records(sessions, mode, unit);
  const chart = sessions
    .filter((s) => s.mode === mode)
    .slice(0, 12)
    .reverse()
    .map((s) => ({ value: sessionBest(s.sets, mode), caption: formatDate(s.startedAt, { weekday: undefined }) }));
  const chartLabel = mode === 'time' ? 'Longest hold per session' : mode === 'reps' ? 'Most reps per session' : `Est. 1-rep max per session (${unit})`;

  async function addToWorkout() {
    if (!active) return;
    await addExercisesToWorkout(db, active.id, [exercise!.id]);
    haptics.success();
    setAdded(true);
  }

  return (
    <Screen>
      <View style={styles.media}>
        <ExerciseThumb id={exercise.id} size={300} animate />
      </View>
      <Text variant="title">{displayName(exercise)}</Text>
      <Row style={styles.tags}>
        {exercise.target.map((t) => (
          <Tag key={t} label={titleCase(t)} tone="accent" />
        ))}
        {exercise.equipment.map((q) => (
          <Tag key={q} label={titleCase(q)} />
        ))}
        {exercise.bodyParts.map((b) => (
          <Tag key={b} label={titleCase(b)} />
        ))}
      </Row>
      {exercise.secondary.length ? (
        <Text variant="caption">Also works: {titleCase(exercise.secondary.join(', '))}</Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Watch full video on YouTube"
          icon="video"
          kind="secondary"
          onPress={() => Linking.openURL(youtubeSearchUrl(exercise))}
        />
        {active ? (
          added ? (
            <Button title={`Added to ${active.name} — open`} icon="check" onPress={() => openWorkout(active.id)} />
          ) : (
            <Button title="Add to current workout" icon="add" onPress={addToWorkout} />
          )
        ) : null}
      </View>

      <SectionHeader title="Your progress" />
      {sessions.length ? (
        <Card style={{ gap: Spacing.three }}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }} gap={Spacing.three}>
            {prs.map((p) => (
              <View key={p.label} style={{ gap: 2 }}>
                <Row gap={4}>
                  <Icon name="trophy" size={12} color="accent" />
                  <Text variant="caption">{p.label}</Text>
                </Row>
                <Text variant="label">{p.value}</Text>
              </View>
            ))}
          </Row>
          {chart.length > 1 ? <ProgressBars points={chart} label={chartLabel} /> : null}
          <Text variant="caption">
            Done {sessions.length} time{sessions.length === 1 ? '' : 's'} · last on {formatDate(sessions[0].startedAt)}
          </Text>
        </Card>
      ) : (
        <Text variant="caption">You haven&apos;t logged this exercise yet. Your sets, best lifts and trends will show up here.</Text>
      )}

      <SectionHeader title="How to do it" />
      <View style={{ gap: Spacing.two }}>
        {exercise.steps.map((step, i) => (
          <Row key={i} style={{ alignItems: 'flex-start' }} gap={Spacing.two}>
            <Text variant="label" color="accent" style={{ width: 20 }}>
              {i + 1}
            </Text>
            <Text style={{ flex: 1 }}>{step}</Text>
          </Row>
        ))}
      </View>

      {sessions.length ? (
        <>
          <SectionHeader title="History" />
          {sessions.slice(0, 20).map((s) => (
            <Card key={`${s.workoutId}-${s.startedAt}-${s.sets.length}`} style={{ marginBottom: Spacing.two, gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                  {s.workoutName}
                </Text>
                <Text variant="caption">{formatDate(s.startedAt)}</Text>
              </Row>
              {s.sets.map((set, i) => (
                <Text key={i} variant="body" color="textSecondary">
                  {i + 1}. {formatSet(set, s.mode, unit)}
                </Text>
              ))}
              <Button
                title="Open workout"
                kind="ghost"
                size="sm"
                style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
                onPress={() => router.push({ pathname: '/workout/[id]', params: { id: String(s.workoutId) } })}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Text variant="caption" style={{ marginTop: Spacing.four, textAlign: 'center' }}>
        Exercise data and animation: ExerciseDB
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  media: { alignItems: 'center', marginTop: Spacing.two, marginBottom: Spacing.three },
  tags: { flexWrap: 'wrap', marginVertical: Spacing.two },
  actions: { gap: Spacing.two, marginTop: Spacing.three },
});
