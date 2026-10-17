import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Row, Text } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/dialogs';
import { formatDuration } from '@/lib/format';

/** Floating countdown shown after a set is checked off. Only runs while the app is open. */
export function RestTimer({
  endAt,
  total,
  onChange,
}: {
  endAt: number;
  total: number;
  onChange: (endAt: number | null, total?: number) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining === 0) {
      haptics.success();
      onChange(null);
    }
  }, [remaining, onChange]);

  const progress = Math.min(1, remaining / Math.max(1, total));

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.backgroundSelected,
          borderColor: theme.border,
          bottom: insets.bottom + Spacing.three,
        },
      ]}>
      <View style={[styles.progress, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={Spacing.two}>
          <Icon name="timer" size={18} color="text" />
          <Text variant="number">{formatDuration(remaining)}</Text>
        </Row>
        <Row gap={Spacing.one}>
          <Button title="−15" kind="secondary" size="sm" onPress={() => onChange(endAt - 15000, total)} />
          <Button title="+15" kind="secondary" size="sm" onPress={() => onChange(endAt + 15000, total + 15)} />
          <Button title="Skip" kind="primary" size="sm" onPress={() => onChange(null)} />
        </Row>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    maxWidth: MaxContentWidth - Spacing.four,
    alignSelf: 'center',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  progress: { position: 'absolute', left: 0, bottom: 0, height: 3 },
});
