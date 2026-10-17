import { router } from 'expo-router';

/** Back if there is somewhere to go back to (e.g. not after a deep link or web reload), else home. */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
