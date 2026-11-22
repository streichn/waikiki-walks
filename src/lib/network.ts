import { useNetworkState } from 'expo-network';

/**
 * Online or not, for the few things that need the internet: street map tiles, cloud sync,
 * and the photo step of "What am I looking at?". Everything else ships inside the app.
 * Unknown counts as online, so we never warn by mistake while the state is loading.
 * Docs: https://docs.expo.dev/versions/v58.0.0/sdk/network/
 */
export function useOnline(): boolean {
  const s = useNetworkState();
  if (s.isConnected === false) return false;
  if (s.isInternetReachable === false) return false;
  return true;
}
