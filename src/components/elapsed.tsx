import { useEffect, useState } from 'react';

import { Text } from '@/components/ui';
import type { ThemeColor } from '@/constants/theme';
import { formatDuration } from '@/lib/format';

/** Live "12:34" clock counting up from `since`. */
export function Elapsed({ since, color, variant = 'label' }: { since: number; color?: ThemeColor; variant?: 'label' | 'number' }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Text variant={variant} color={color} style={{ fontVariant: ['tabular-nums'] }}>
      {formatDuration((now - since) / 1000)}
    </Text>
  );
}
