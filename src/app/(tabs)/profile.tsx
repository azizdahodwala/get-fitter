import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { ProgressBars } from '@/components/progress-bars';
import { Button, Card, Chip, Row, Screen, SectionHeader, Segmented, Tag, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ALL_EQUIPMENT, DEFAULT_EQUIPMENT, titleCase } from '@/data/catalog';
import { levelLabel, programFor } from '@/data/programs';
import { exportBackup, importBackup, listBodyMetrics, parseBackup, type BodyMetric } from '@/db/repo';
import { formatDelta, formatMetric, latestValues, METRICS, metricNumber } from '@/lib/body';
import { readBackupFile, saveBackupFile } from '@/lib/backup-file';
import { confirm, notify } from '@/lib/dialogs';
import { bmi, formatDate, formatHeight, type Unit } from '@/lib/format';
import { useSettings } from '@/lib/settings';

const REST_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
];

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const { settings, update, reload } = useSettings();
  const [entries, setEntries] = useState<BodyMetric[]>([]);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const load = useCallback(async () => setEntries(await listBodyMetrics(db)), [db]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const unit = settings.unit;
  const latest = latestValues(entries);
  const age = settings.birthYear ? new Date().getFullYear() - settings.birthYear : null;
  const bmiValue = bmi(latest.weight_kg?.value, settings.heightCm);
  const weightPoints = entries
    .filter((e) => e.weight_kg != null)
    .slice(0, 12)
    .reverse()
    .map((e) => ({ value: metricNumber(e.weight_kg!, 'weight', unit), caption: formatDate(e.measured_at, { weekday: undefined }) }));
  const program = programFor(settings.level);

  function toggleEquipment(q: string) {
    const has = settings.equipment.includes(q);
    update({ equipment: has ? settings.equipment.filter((x) => x !== q) : [...settings.equipment, q] });
  }

  async function onExport() {
    setBusy('export');
    try {
      await saveBackupFile(await exportBackup(db));
    } catch (e) {
      notify('Export failed', String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onImport() {
    setBusy('import');
    try {
      const text = await readBackupFile();
      if (!text) return;
      const backup = parseBackup(text);
      const ok = await confirm({
        title: 'Replace all data?',
        message: `This replaces everything in the app with the backup from ${new Date(backup.exportedAt).toLocaleString()}.`,
        confirmText: 'Replace',
        destructive: true,
      });
      if (!ok) return;
      await importBackup(db, backup);
      await reload();
      await load();
      notify('Backup restored');
    } catch (e) {
      notify('Import failed', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen tab>
      <Text variant="largeTitle">Profile</Text>

      <Card style={{ marginTop: Spacing.three, gap: Spacing.three }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Tag label={levelLabel(settings.level)} tone="accent" />
          <Button title="Edit" kind="ghost" size="sm" onPress={() => router.push('/profile/edit')} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Age" value={age != null ? String(age) : '—'} />
          <Stat label="Height" value={formatHeight(settings.heightCm, unit)} />
          <Stat label="Weight" value={formatMetric(latest.weight_kg?.value, 'weight', unit)} />
          <Stat label="BMI" value={bmiValue != null ? String(bmiValue) : '—'} />
        </Row>
        {program ? (
          <Button
            title={`Plan: ${program.name}`}
            kind="secondary"
            size="sm"
            onPress={() => router.push('/plan')}
          />
        ) : null}
      </Card>

      <SectionHeader
        title="Body"
        action={<Button title="Log" icon="add" kind="ghost" size="sm" onPress={() => router.push('/body/log')} />}
      />
      <Card style={{ gap: Spacing.three }}>
        {entries.length ? (
          <>
            <Row style={{ flexWrap: 'wrap', rowGap: Spacing.three }} gap={0}>
              {METRICS.map((m) => {
                const v = latest[m.key];
                const delta = v ? formatDelta(v.delta, m.kind, unit) : null;
                return (
                  <View key={m.key} style={{ width: '33.33%', gap: 2 }}>
                    <Text variant="caption">{m.label}</Text>
                    <Text variant="label">{formatMetric(v?.value, m.kind, unit)}</Text>
                    {delta ? <Text variant="caption">{delta}</Text> : null}
                  </View>
                );
              })}
            </Row>
            {weightPoints.length > 1 ? <ProgressBars points={weightPoints} label={`Weight (${unit})`} /> : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="caption">Last logged {formatDate(entries[0].measured_at)}</Text>
              <Button title="All entries" kind="ghost" size="sm" onPress={() => router.push('/body')} />
            </Row>
          </>
        ) : (
          <View style={{ gap: Spacing.two }}>
            <Text variant="caption">
              Log your weight, body-fat % and measurements to see how they change over time.
            </Text>
            <Button title="Log measurements" icon="add" onPress={() => router.push('/body/log')} />
          </View>
        )}
      </Card>

      <SectionHeader title="Settings" />
      <Card style={{ gap: Spacing.four }}>
        <View style={{ gap: Spacing.two }}>
          <Text variant="label">Units</Text>
          <Segmented
            options={[
              { value: 'kg' as Unit, label: 'Metric (kg, cm)' },
              { value: 'lb' as Unit, label: 'Imperial (lb, in)' },
            ]}
            value={unit}
            onChange={(u) => update({ unit: u })}
          />
        </View>
        <View style={{ gap: Spacing.two }}>
          <Text variant="label">Rest timer after each set</Text>
          <Segmented options={REST_OPTIONS} value={settings.restSeconds} onChange={(s) => update({ restSeconds: s })} />
        </View>
        <View style={{ gap: Spacing.two }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="label">My equipment</Text>
            <Button title="Reset" kind="ghost" size="sm" onPress={() => update({ equipment: DEFAULT_EQUIPMENT })} />
          </Row>
          <Text variant="caption">The library’s “My equipment” filter only shows exercises you can do with these.</Text>
          <Row style={{ flexWrap: 'wrap' }}>
            {ALL_EQUIPMENT.map((q) => (
              <Chip key={q} label={titleCase(q)} selected={settings.equipment.includes(q)} onPress={() => toggleEquipment(q)} />
            ))}
          </Row>
        </View>
      </Card>

      <SectionHeader title="Backup" />
      <Card style={{ gap: Spacing.two }}>
        <Text variant="caption">
          Your data lives only on this device. Export a backup file now and then (e.g. to Files, Drive or email) so you
          can restore it on a new phone.
        </Text>
        <Row>
          <Button title="Export" icon="share" kind="secondary" style={{ flex: 1 }} loading={busy === 'export'} onPress={onExport} />
          <Button title="Import" icon="download" kind="secondary" style={{ flex: 1 }} loading={busy === 'import'} onPress={onImport} />
        </Row>
      </Card>

      <Text variant="caption" style={{ textAlign: 'center', marginTop: Spacing.five }}>
        Get Fitter {Constants.expoConfig?.version ?? ''} · Exercise data and animations from ExerciseDB · Videos via YouTube
      </Text>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2, alignItems: 'center', flex: 1 }}>
      <Text variant="heading" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}
