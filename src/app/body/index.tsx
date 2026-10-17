import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ProgressBars } from '@/components/progress-bars';
import { Button, Card, Chip, EmptyState, Icon, Row, Screen, SectionHeader, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { listBodyMetrics, type BodyMetric } from '@/db/repo';
import { formatMetric, METRICS, metricNumber, metricUnit, type MetricKey } from '@/lib/body';
import { formatDate } from '@/lib/format';
import { useSettings } from '@/lib/settings';

export default function BodyScreen() {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [entries, setEntries] = useState<BodyMetric[]>([]);
  const [metric, setMetric] = useState<MetricKey>('weight_kg');

  useFocusEffect(
    useCallback(() => {
      let live = true;
      listBodyMetrics(db).then((e) => live && setEntries(e));
      return () => {
        live = false;
      };
    }, [db]),
  );

  const unit = settings.unit;
  const def = METRICS.find((m) => m.key === metric)!;
  const series = entries.filter((e) => e[metric] != null);
  const values = series.map((e) => metricNumber(e[metric]!, def.kind, unit));
  const points = series
    .slice(0, 20)
    .reverse()
    .map((e) => ({ value: metricNumber(e[metric]!, def.kind, unit), caption: formatDate(e.measured_at, { weekday: undefined }) }));
  const change = series.length > 1 ? series[0][metric]! - series[series.length - 1][metric]! : null;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: 'Body',
          headerRight: () => <Button title="Log" icon="add" kind="ghost" size="sm" onPress={() => router.push('/body/log')} />,
        }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two, paddingVertical: 2 }}>
        {METRICS.map((m) => (
          <Chip key={m.key} label={m.label} selected={metric === m.key} onPress={() => setMetric(m.key)} />
        ))}
      </ScrollView>

      <Card style={{ marginTop: Spacing.three, gap: Spacing.three }}>
        {series.length ? (
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <Summary label="Latest" value={formatMetric(series[0][metric], def.kind, unit)} />
              <Summary label="Lowest" value={`${Math.min(...values)} ${metricUnit(def.kind, unit)}`} />
              <Summary label="Highest" value={`${Math.max(...values)} ${metricUnit(def.kind, unit)}`} />
            </Row>
            {points.length > 1 ? <ProgressBars points={points} label={`${def.label} (${metricUnit(def.kind, unit)})`} /> : null}
            {change != null ? (
              <Text variant="caption">
                {change === 0
                  ? 'No change'
                  : `${change > 0 ? 'Up' : 'Down'} ${formatMetric(Math.abs(change), def.kind, unit)}`}{' '}
                since {formatDate(series[series.length - 1].measured_at, { year: 'numeric' })}
              </Text>
            ) : null}
          </>
        ) : (
          <EmptyState icon="history" title={`No ${def.label.toLowerCase()} logged yet`} />
        )}
      </Card>

      <SectionHeader title="All entries" />
      {entries.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/body/log', params: { id: String(e.id) } })}
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Card style={{ marginBottom: Spacing.two, gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="label">{formatDate(e.measured_at, { year: 'numeric' })}</Text>
              <Icon name="chevronRight" size={14} color="textSecondary" />
            </Row>
            <Text variant="caption">
              {METRICS.filter((m) => e[m.key] != null)
                .map((m) => `${m.label} ${formatMetric(e[m.key], m.kind, unit)}`)
                .join(' · ')}
            </Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption">{label}</Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}
