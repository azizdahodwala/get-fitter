import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { RoutineCard } from '@/components/routine-card';
import { Button, Card, Chip, Icon, Row, Screen, SectionHeader, Tag, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { LEVELS, programFor, WEEKDAYS, type Level } from '@/data/programs';
import { listRoutines, type RoutineSummary } from '@/db/repo';
import { programRoutines } from '@/lib/plan';
import { useSettings } from '@/lib/settings';
import { startWorkoutFlow } from '@/lib/workout-flow';

export default function PlanScreen() {
  const params = useLocalSearchParams<{ level?: Level }>();
  const db = useSQLiteContext();
  const { settings, update } = useSettings();
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [viewing, setViewing] = useState<Level>(params.level ?? settings.level ?? 'beginner');

  useFocusEffect(
    useCallback(() => {
      let live = true;
      listRoutines(db).then((r) => live && setRoutines(r));
      return () => {
        live = false;
      };
    }, [db]),
  );

  const program = programFor(viewing)!;
  const { byKey, routines: planRoutines } = programRoutines(program, routines);
  const isMine = viewing === settings.level;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Training Plan' }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two, paddingVertical: 2 }}>
        {LEVELS.map((l) => (
          <Chip key={l.value} label={l.label} selected={viewing === l.value} onPress={() => setViewing(l.value)} />
        ))}
      </ScrollView>

      <View style={{ marginTop: Spacing.three, gap: Spacing.one }}>
        <Row>
          <Tag label={LEVELS.find((l) => l.value === viewing)!.label} tone="accent" />
          {isMine ? <Tag label="Your level" /> : null}
        </Row>
        <Text variant="title">{program.name}</Text>
        <Text color="textSecondary">{program.summary}</Text>
        <Text variant="caption">
          {program.daysPerWeek} days a week · rest about {program.restSeconds}s between sets
        </Text>
      </View>

      {!isMine ? (
        <Button
          title="Make this my level"
          kind="secondary"
          style={{ marginTop: Spacing.three }}
          onPress={() => update({ level: viewing, restSeconds: program.restSeconds })}
        />
      ) : null}

      <SectionHeader title="Suggested week" />
      <Card style={{ paddingVertical: Spacing.one }}>
        {program.week.map((key, i) => {
          const r = key ? byKey.get(key) : undefined;
          return (
            <Pressable
              key={i}
              disabled={!r}
              onPress={() => r && router.push({ pathname: '/routine/[id]', params: { id: String(r.id) } })}
              style={({ pressed }) => [{ paddingVertical: 10 }, pressed && { opacity: 0.6 }]}>
              <Row>
                <Text variant="label" style={{ width: 48 }}>
                  {WEEKDAYS[i]}
                </Text>
                <Text style={{ flex: 1 }} color={r ? 'text' : 'textSecondary'}>
                  {r ? r.name : key ? 'Routine deleted' : 'Rest'}
                </Text>
                {r ? <Icon name="chevronRight" size={14} color="textSecondary" /> : null}
              </Row>
            </Pressable>
          );
        })}
      </Card>
      <Text variant="caption" style={{ marginTop: Spacing.two }}>
        Missed a day? No problem: “Next up” on the Workouts tab picks up with the next workout in the rotation.
      </Text>

      <SectionHeader title="How to train" />
      <View style={{ gap: Spacing.two }}>
        {program.guidance.map((g, i) => (
          <Row key={i} style={{ alignItems: 'flex-start' }}>
            <Icon name="check" size={14} color="accent" />
            <Text style={{ flex: 1 }}>{g}</Text>
          </Row>
        ))}
      </View>

      <SectionHeader title="Workouts in this plan" />
      {planRoutines.map((r) => (
        <RoutineCard key={r.id} routine={r} onStart={() => startWorkoutFlow(db, r.id)} />
      ))}

      <Text variant="caption" style={{ marginTop: Spacing.four, textAlign: 'center' }}>
        General fitness guidance, not medical advice. Check with a doctor before starting if you have health concerns.
      </Text>
    </Screen>
  );
}
