import * as SplashScreen from 'expo-splash-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_EQUIPMENT } from '@/data/catalog';
import type { Level } from '@/data/programs';
import { loadSettings, saveSetting } from '@/db/repo';
import type { Unit } from '@/lib/format';

export type Settings = {
  /** Weight unit; also picks cm (kg) or inches (lb) for body measurements. */
  unit: Unit;
  /** Equipment the user has access to; filters the library. */
  equipment: string[];
  restSeconds: number;
  /** Experience level; null until onboarding is done. */
  level: Level | null;
  birthYear: number | null;
  heightCm: number | null;
};

const DEFAULTS: Settings = {
  unit: 'kg',
  equipment: DEFAULT_EQUIPMENT,
  restSeconds: 90,
  level: null,
  birthYear: null,
  heightCm: null,
};

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => Promise<void>;
  reload: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function parse(raw: Record<string, string>): Settings {
  const read = <K extends keyof Settings>(key: K): Settings[K] => {
    try {
      return raw[key] != null ? (JSON.parse(raw[key]) as Settings[K]) : DEFAULTS[key];
    } catch {
      return DEFAULTS[key];
    }
  };
  return {
    unit: read('unit'),
    equipment: read('equipment'),
    restSeconds: read('restSeconds'),
    level: read('level'),
    birthYear: read('birthYear'),
    heightCm: read('heightCm'),
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Settings | null>(null);

  const reload = useCallback(async () => {
    setSettings(parse(await loadSettings(db)));
  }, [db]);

  useEffect(() => {
    let live = true;
    loadSettings(db)
      .then((raw) => live && setSettings(parse(raw)))
      .finally(() => SplashScreen.hideAsync().catch(() => {}));
    return () => {
      live = false;
    };
  }, [db]);

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      setSettings((s) => (s ? { ...s, ...patch } : s));
      for (const [key, value] of Object.entries(patch)) await saveSetting(db, key, JSON.stringify(value));
    },
    [db],
  );

  if (!settings) return null;
  return <SettingsContext.Provider value={{ settings, update, reload }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
