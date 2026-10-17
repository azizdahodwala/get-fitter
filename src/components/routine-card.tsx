import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, ExerciseThumb, Row, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getExercise, titleCase } from '@/data/catalog';
import type { RoutineSummary } from '@/db/repo';

function equipmentSummary(ids: string[]) {
  const set = new Set<string>();
  for (const id of ids) for (const q of getExercise(id)?.equipment ?? []) set.add(q);
  return titleCase([...set].slice(0, 3).join(', '));
}

export function RoutineCard({ routine, onStart }: { routine: RoutineSummary; onStart: () => void }) {
  const n = routine.exerciseIds.length;
  return (
    // No button role here: the card contains a Start button, and buttons can't nest on web.
    <Pressable
      accessibilityLabel={`${routine.name}, open routine`}
      onPress={() => router.push({ pathname: '/routine/[id]', params: { id: String(routine.id) } })}
      style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={styles.card}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading" numberOfLines={1}>
              {routine.name}
            </Text>
            <Text variant="caption" numberOfLines={1}>
              {n} exercise{n === 1 ? '' : 's'}
              {n ? ` · ${equipmentSummary(routine.exerciseIds)}` : ''}
            </Text>
          </View>
          <Button title="Start" icon="play" size="sm" onPress={onStart} disabled={!n} />
        </Row>
        {n ? (
          <Row gap={6}>
            {routine.exerciseIds.slice(0, 5).map((id, i) => (
              <ExerciseThumb key={`${id}-${i}`} id={id} size={44} />
            ))}
            {n > 5 ? (
              <Text variant="caption" style={{ marginLeft: 4 }}>
                +{n - 5}
              </Text>
            ) : null}
          </Row>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, marginBottom: Spacing.two },
});
