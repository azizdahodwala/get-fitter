import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Elapsed } from '@/components/elapsed';
import { PlanCard } from '@/components/plan-card';
import { RoutineCard } from '@/components/routine-card';
import { Button, Card, Chip, Icon, Row, Screen, SectionHeader, Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { byStarterOrder, LEVELS, levelLabel, type Level } from '@/data/programs';
import { getActiveWorkout, listRoutines, type RoutineSummary, type Workout } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { getPlanStatus, type PlanStatus } from '@/lib/plan';
import { useSettings } from '@/lib/settings';
import { openWorkout, startWorkoutFlow } from '@/lib/workout-flow';

export default function WorkoutsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { settings } = useSettings();
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [active, setActive] = useState<Workout | null>(null);
  const [plan, setPlan] = useState<PlanStatus | null>(null);
  const [browsing, setBrowsing] = useState<Level | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        const [r, a] = await Promise.all([listRoutines(db), getActiveWorkout(db)]);
        const p = await getPlanStatus(db, settings.level, r);
        if (live) {
          setRoutines(r);
          setActive(a);
          setPlan(p);
        }
      })();
      return () => {
        live = false;
      };
    }, [db, settings.level]),
  );

  const start = (routineId?: number) => startWorkoutFlow(db, routineId);
  const mine = routines.filter((r) => !r.starter_key);
  const planIds = new Set(plan?.routines.map((r) => r.id));
  const browseLevel = browsing ?? settings.level ?? 'beginner';
  const others = routines
    .filter((r) => r.starter_key && !planIds.has(r.id) && r.level === browseLevel)
    .sort(byStarterOrder);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Screen tab>
      <Text variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {today}
      </Text>
      <Text variant="largeTitle">Workouts</Text>

      {active ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => openWorkout(active.id)}
          style={({ pressed }) => [styles.active, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" style={{ color: theme.onAccent, opacity: 0.85 }}>
              IN PROGRESS
            </Text>
            <Text variant="heading" style={{ color: theme.onAccent }} numberOfLines={1}>
              {active.name}
            </Text>
          </View>
          <Row gap={6}>
            <Icon name="timer" size={16} color={theme.onAccent} />
            <Elapsed since={active.started_at} color="onAccent" />
            <Icon name="chevronRight" size={14} color={theme.onAccent} />
          </Row>
        </Pressable>
      ) : null}

      {plan ? (
        <PlanCard status={plan} onStart={start} />
      ) : (
        <Card style={{ marginTop: Spacing.three, gap: Spacing.two }}>
          <Text variant="heading">Get a plan for your level</Text>
          <Text variant="caption">Tell us your experience level and we&apos;ll suggest a weekly plan.</Text>
          <Button title="Set my level" onPress={() => router.push('/profile/edit')} />
        </Card>
      )}

      <Button
        title="Start empty workout"
        icon="add"
        kind="secondary"
        style={{ marginTop: Spacing.three }}
        onPress={() => start()}
      />

      {plan?.routines.length ? (
        <>
          <SectionHeader title={`Recommended for ${levelLabel(settings.level)}`} />
          {plan.routines.map((r) => (
            <RoutineCard key={r.id} routine={r} onStart={() => start(r.id)} />
          ))}
        </>
      ) : null}

      <SectionHeader
        title="My routines"
        action={<Button title="New" icon="add" kind="ghost" size="sm" onPress={() => router.push('/routine/edit')} />}
      />
      {mine.length ? (
        mine.map((r) => <RoutineCard key={r.id} routine={r} onStart={() => start(r.id)} />)
      ) : (
        <Text variant="caption" style={{ marginBottom: Spacing.two }}>
          Build your own routine, or duplicate any routine here and tweak it.
        </Text>
      )}

      <SectionHeader title="More routines" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.two, paddingVertical: 2 }}
        style={{ marginBottom: Spacing.three }}>
        {LEVELS.map((l) => (
          <Chip key={l.value} label={l.label} selected={browseLevel === l.value} onPress={() => setBrowsing(l.value)} />
        ))}
      </ScrollView>
      {others.length ? (
        others.map((r) => <RoutineCard key={r.id} routine={r} onStart={() => start(r.id)} />)
      ) : (
        <Text variant="caption">No other {levelLabel(browseLevel).toLowerCase()} routines.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  active: {
    marginTop: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
