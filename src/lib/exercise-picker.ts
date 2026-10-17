import { router } from 'expo-router';

// Expo Router has no "return a value from a screen", so the picker resolves a
// promise held here. Only one picker can be open at a time.
let pending: ((ids: string[]) => void) | null = null;

/** Opens the exercise picker and resolves with the chosen ids (empty if cancelled). */
export function pickExercises(): Promise<string[]> {
  pending?.([]);
  return new Promise((resolve) => {
    pending = resolve;
    router.push('/pick-exercise');
  });
}

export function resolvePick(ids: string[]) {
  const resolve = pending;
  pending = null;
  resolve?.(ids);
}
