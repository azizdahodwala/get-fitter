import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Row, Screen, Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { deleteBodyMetric, getBodyMetric, listBodyMetrics, saveBodyMetric, type BodyMetric } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { latestValues, METRICS, metricText, metricUnit, parseMetric, type MetricKey } from '@/lib/body';
import { confirm, notify } from '@/lib/dialogs';
import { formatDate } from '@/lib/format';
import { useSettings } from '@/lib/settings';
import { goBack } from '@/lib/nav';

type Texts = Record<MetricKey, string>;
const EMPTY: Texts = { weight_kg: '', body_fat: '', waist_cm: '', chest_cm: '', hips_cm: '', arm_cm: '' };

export default function LogBodyScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const entryId = id ? Number(id) : undefined;
  const db = useSQLiteContext();
  const theme = useTheme();
  const { settings } = useSettings();
  const unit = settings.unit;
  const [texts, setTexts] = useState<Texts>(EMPTY);
  const [hints, setHints] = useState<Texts>(EMPTY);
  const [existing, setExisting] = useState<BodyMetric | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (entryId) {
        const e = await getBodyMetric(db, entryId);
        if (!e) return;
        setExisting(e);
        setTexts(Object.fromEntries(METRICS.map((m) => [m.key, metricText(e[m.key], m.kind, unit)])) as Texts);
      } else {
        // Placeholders show the last value logged for each metric.
        const latest = latestValues(await listBodyMetrics(db));
        setHints(Object.fromEntries(METRICS.map((m) => [m.key, metricText(latest[m.key]?.value, m.kind, unit)])) as Texts);
      }
    })();
  }, [db, entryId, unit]);

  async function save() {
    const values = {} as Record<MetricKey, number | null>;
    for (const m of METRICS) {
      values[m.key] = parseMetric(texts[m.key], m.kind, unit);
      if (texts[m.key].trim() && values[m.key] == null) return notify(`Check the ${m.label.toLowerCase()} value`);
    }
    if (METRICS.every((m) => values[m.key] == null)) return notify('Enter at least one measurement');
    setSaving(true);
    try {
      await saveBodyMetric(db, { id: entryId, measured_at: existing?.measured_at ?? Date.now(), ...values });
      goBack();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!entryId) return;
    if (!(await confirm({ title: 'Delete this entry?', confirmText: 'Delete', destructive: true }))) return;
    await deleteBodyMetric(db, entryId);
    goBack();
  }

  return (
    <Screen automaticallyAdjustKeyboardInsets>
      <Stack.Screen
        options={{
          title: entryId ? 'Edit Entry' : 'Log Measurements',
          headerLeft: () => <Button title="Cancel" kind="ghost" size="sm" onPress={() => goBack()} />,
          headerRight: () => <Button title="Save" kind="ghost" size="sm" loading={saving} onPress={save} />,
        }}
      />
      <Text variant="caption" style={{ marginBottom: Spacing.three }}>
        {existing ? formatDate(existing.measured_at, { year: 'numeric' }) : 'Today'} · fill in whatever you measured; the
        rest can stay blank. Measure at the same time of day for the most useful trend.
      </Text>
      <View style={{ gap: Spacing.three }}>
        {METRICS.map((m) => (
          <Row key={m.key} style={{ justifyContent: 'space-between' }}>
            <Text variant="label" style={{ flex: 1 }}>
              {m.label}
            </Text>
            <Row gap={Spacing.two}>
              <TextInput
                value={texts[m.key]}
                onChangeText={(t) => setTexts((cur) => ({ ...cur, [m.key]: t }))}
                placeholder={hints[m.key] || '—'}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                accessibilityLabel={`${m.label} in ${metricUnit(m.kind, unit)}`}
              />
              <Text color="textSecondary" style={{ width: 28 }}>
                {metricUnit(m.kind, unit)}
              </Text>
            </Row>
          </Row>
        ))}
      </View>
      <Button title="Save" size="lg" loading={saving} onPress={save} style={{ marginTop: Spacing.five }} />
      {entryId ? (
        <Button title="Delete entry" icon="trash" kind="danger" onPress={remove} style={{ marginTop: Spacing.two }} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { width: 100, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 17, textAlign: 'right' },
});
