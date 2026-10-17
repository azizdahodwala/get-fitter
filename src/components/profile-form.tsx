import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Icon, Row, SectionHeader, Segmented, Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { LEVELS, type Level } from '@/data/programs';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/dialogs';
import { cmToFeetInches, feetInchesToCm, formatWeight, parseWeight, type Unit } from '@/lib/format';

export type ProfileValues = {
  level: Level;
  unit: Unit;
  birthYear: number | null;
  heightCm: number | null;
  /** Only collected when `askWeight` is set (onboarding). */
  weightKg: number | null;
};

const THIS_YEAR = new Date().getFullYear();

export function ProfileForm({
  initial,
  askWeight,
  submitTitle,
  onSubmit,
}: {
  initial: { level: Level | null; unit: Unit; birthYear: number | null; heightCm: number | null };
  askWeight?: boolean;
  submitTitle: string;
  onSubmit: (v: ProfileValues) => Promise<void>;
}) {
  const theme = useTheme();
  const [level, setLevel] = useState<Level | null>(initial.level);
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [birthYear, setBirthYear] = useState(initial.birthYear ? String(initial.birthYear) : '');
  const ft = initial.heightCm ? cmToFeetInches(initial.heightCm) : null;
  const [cm, setCm] = useState(initial.heightCm ? String(Math.round(initial.heightCm)) : '');
  const [feet, setFeet] = useState(ft ? String(ft.feet) : '');
  const [inches, setInches] = useState(ft ? String(ft.inches) : '');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const year = parseInt(birthYear, 10);
  const age = year > 1900 && year <= THIS_YEAR ? THIS_YEAR - year : null;

  function heightCm() {
    if (unit === 'kg') {
      const n = parseFloat(cm.replace(',', '.'));
      return n > 50 && n < 260 ? n : null;
    }
    const f = parseInt(feet, 10) || 0;
    const i = parseFloat(inches.replace(',', '.')) || 0;
    const total = feetInchesToCm(f, i);
    return total > 50 && total < 260 ? total : null;
  }

  function changeUnit(next: Unit) {
    // Carry typed height across units so switching doesn't lose it.
    const h = heightCm();
    if (h) {
      const fi = cmToFeetInches(h);
      setCm(String(Math.round(h)));
      setFeet(String(fi.feet));
      setInches(String(fi.inches));
    }
    const w = parseWeight(weight, unit);
    if (w != null) setWeight(formatWeight(w, next));
    setUnit(next);
  }

  async function submit() {
    if (!level) return notify('Pick your experience level', 'It decides which plan we recommend.');
    if (birthYear && !age) return notify('Check your birth year', `Enter a year like ${THIS_YEAR - 30}.`);
    setSaving(true);
    try {
      await onSubmit({
        level,
        unit,
        birthYear: age ? year : null,
        heightCm: heightCm(),
        weightKg: askWeight ? parseWeight(weight, unit) : null,
      });
    } finally {
      setSaving(false);
    }
  }

  const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <View>
      <SectionHeader title="Experience level" />
      <View style={{ gap: Spacing.two }}>
        {LEVELS.map((l) => {
          const selected = l.value === level;
          return (
            <Pressable
              key={l.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setLevel(l.value)}
              style={[
                styles.level,
                { backgroundColor: theme.card, borderColor: selected ? theme.accent : theme.border },
                selected && { borderWidth: 2 },
              ]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="label">{l.label}</Text>
                <Text variant="caption">{l.blurb}</Text>
              </View>
              {selected ? <Icon name="check" size={18} color="accent" /> : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Units" />
      <Segmented
        options={[
          { value: 'kg' as Unit, label: 'Metric (kg, cm)' },
          { value: 'lb' as Unit, label: 'Imperial (lb, in)' },
        ]}
        value={unit}
        onChange={changeUnit}
      />

      <SectionHeader title="About you" />
      <View style={{ gap: Spacing.three }}>
        <Field label="Birth year" hint={age != null ? `Age ${age}` : 'Optional'}>
          <TextInput
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder={String(THIS_YEAR - 30)}
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={4}
            style={input}
          />
        </Field>
        <Field label="Height" hint="Optional, used for BMI">
          {unit === 'kg' ? (
            <Row>
              <TextInput
                value={cm}
                onChangeText={setCm}
                placeholder="175"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={input}
              />
              <Text color="textSecondary">cm</Text>
            </Row>
          ) : (
            <Row>
              <TextInput
                value={feet}
                onChangeText={setFeet}
                placeholder="5"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                maxLength={1}
                style={[input, { width: 56 }]}
              />
              <Text color="textSecondary">ft</Text>
              <TextInput
                value={inches}
                onChangeText={setInches}
                placeholder="9"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                maxLength={4}
                style={[input, { width: 64 }]}
              />
              <Text color="textSecondary">in</Text>
            </Row>
          )}
        </Field>
        {askWeight ? (
          <Field label="Current weight" hint="Optional, starts your weight log">
            <Row>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder={unit === 'kg' ? '72' : '160'}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={input}
              />
              <Text color="textSecondary">{unit}</Text>
            </Row>
          </Field>
        ) : null}
      </View>

      <Button title={submitTitle} size="lg" loading={saving} onPress={submit} style={{ marginTop: Spacing.five }} />
    </View>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="label">{label}</Text>
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </Row>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 17, minWidth: 96 },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
});
