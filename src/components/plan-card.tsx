import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Row, Tag, Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { levelLabel } from '@/data/programs';
import { useTheme } from '@/hooks/use-theme';
import type { PlanStatus } from '@/lib/plan';

export function PlanCard({ status, onStart }: { status: PlanStatus; onStart: (routineId: number) => void }) {
  const theme = useTheme();
  const { program, next, doneThisWeek } = status;
  const target = program.daysPerWeek;
  return (
    <Card style={styles.card}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Your plan
        </Text>
        <Tag label={levelLabel(program.level)} tone="accent" />
      </Row>
      <View style={{ gap: 2 }}>
        <Text variant="title">{program.name}</Text>
        <Text variant="caption">{program.summary}</Text>
      </View>

      <View style={{ gap: 6 }}>
        <Row gap={6}>
          {Array.from({ length: target }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i < doneThisWeek ? theme.success : theme.backgroundSelected }]}
            />
          ))}
        </Row>
        <Text variant="caption">
          {Math.min(doneThisWeek, target)} of {target} workouts this week
          {doneThisWeek >= target ? ' — target hit!' : ''}
        </Text>
      </View>

      {next ? (
        <View style={[styles.next, { backgroundColor: theme.backgroundElement }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption">NEXT UP</Text>
            <Text variant="heading" numberOfLines={1}>
              {next.name}
            </Text>
            <Text variant="caption">{next.exerciseIds.length} exercises</Text>
          </View>
          <Button title="Start" icon="play" onPress={() => onStart(next.id)} />
        </View>
      ) : null}

      <Button title="View full plan" kind="ghost" size="sm" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.push('/plan')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, marginTop: Spacing.three },
  dot: { flex: 1, height: 8, borderRadius: 4, maxWidth: 48 },
  next: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.md },
});
