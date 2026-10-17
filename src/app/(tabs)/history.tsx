import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, Icon, Row, Text } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { displayName, getExercise } from '@/data/catalog';
import { listWorkoutHistory, type WorkoutSummary } from '@/db/repo';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatSpan, formatVolume, startOfWeek } from '@/lib/format';
import { useSettings } from '@/lib/settings';

/** Consecutive weeks (ending this week or last) with at least one workout. */
function weekStreak(times: number[]) {
  const weeks = new Set(times.map((t) => startOfWeek(new Date(t))));
  const WEEK = 7 * 24 * 3600 * 1000;
  let cursor = startOfWeek();
  if (!weeks.has(cursor)) cursor -= WEEK;
  let n = 0;
  // Round to tolerate DST shifts between week starts.
  while ([...weeks].some((w) => Math.abs(w - cursor) < 2 * 3600 * 1000)) {
    n++;
    cursor -= WEEK;
  }
  return n;
}

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const { settings } = useSettings();
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      listWorkoutHistory(db).then((w) => live && setWorkouts(w));
      return () => {
        live = false;
      };
    }, [db]),
  );

  const sections = useMemo(() => {
    const groups = new Map<string, WorkoutSummary[]>();
    for (const w of workouts ?? []) {
      const key = new Date(w.started_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      groups.set(key, [...(groups.get(key) ?? []), w]);
    }
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [workouts]);

  if (!workouts) return null;
  const weekStart = startOfWeek();
  const thisWeek = workouts.filter((w) => w.started_at >= weekStart).length;
  const streak = weekStreak(workouts.map((w) => w.started_at));

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three, paddingBottom: tabInset + Spacing.five }]}
      sections={sections}
      keyExtractor={(w) => String(w.id)}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={{ gap: Spacing.three, marginBottom: Spacing.two }}>
          <Text variant="largeTitle">History</Text>
          <Row gap={Spacing.two}>
            <StatTile label="This week" value={String(thisWeek)} />
            <StatTile label="Week streak" value={String(streak)} icon />
            <StatTile label="All time" value={String(workouts.length)} />
          </Row>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="history"
          title="No workouts yet"
          message="Finish a workout and it will show up here with your sets, reps and weights."
        />
      }
      renderSectionHeader={({ section }) => (
        <Text variant="heading" style={{ marginTop: Spacing.three, marginBottom: Spacing.two }}>
          {section.title}
        </Text>
      )}
      renderItem={({ item: w }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/workout/[id]', params: { id: String(w.id) } })}
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Card style={{ marginBottom: Spacing.two, gap: Spacing.two }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
                {w.name}
              </Text>
              <Icon name="chevronRight" size={14} color="textSecondary" />
            </Row>
            <Text variant="caption">
              {formatDate(w.started_at)} · {formatSpan((w.finished_at ?? w.started_at) - w.started_at)} · {w.set_count} sets
              {w.volume_kg ? ` · ${formatVolume(w.volume_kg, settings.unit)}` : ''}
            </Text>
            <View style={{ gap: 2 }}>
              {w.exercises.slice(0, 4).map((e, i) => (
                <Text key={i} variant="body" color="textSecondary" numberOfLines={1}>
                  {e.sets} × {displayName(getExercise(e.exercise_id))}
                </Text>
              ))}
              {w.exercises.length > 4 ? (
                <Text variant="caption">+{w.exercises.length - 4} more</Text>
              ) : null}
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <Card style={{ flex: 1, gap: 2, paddingVertical: Spacing.two + 4 }}>
      <Row gap={4}>
        <Text variant="number">{value}</Text>
        {icon ? <Icon name="flame" size={16} color="accent" /> : null}
      </Row>
      <Text variant="caption">{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
});
