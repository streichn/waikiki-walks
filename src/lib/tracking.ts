import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { DEFAULT_ARRIVAL_RADIUS_M } from '../config';
import { getWalk, onMap } from '../data';
import type { Walk } from '../data/types';
import { useAccount, useProgress, useSettings } from '../store';
import { canOpenStop } from './access';
import * as LiveActivity from './liveActivity';

/**
 * Arrival detection has three layers, so it keeps working if one fails:
 * 1. Foreground: a high-accuracy position watch while the walk screen is open.
 * 2. Background: OS geofences around the next few stops; the OS wakes the app on entry
 *    and we post a local notification ("You've arrived at ...").
 * 3. Manual: the walker can always tap Next.
 * The persistent "walk in progress" indicator is a Live Activity on iOS and the
 * foreground-service notification on Android.
 */

export const GEOFENCE_TASK = 'waikiki-walks-geofence';
export const LOCATION_TASK = 'waikiki-walks-location';
const MAX_REGIONS = 18; // iOS allows 20 monitored regions per app

/** Android channel for arrival alerts. Its name and description show in the phone's notification settings. */
export const ARRIVAL_CHANNEL = 'arrivals';
/**
 * One identifier for every arrival alert, so a new arrival replaces the last one
 * instead of piling up in Notification Center (Apple: avoid several notifications for the same thing).
 */
export const ARRIVAL_NOTIFICATION_ID = 'arrival';

/**
 * Android 8+ files every notification under a channel, and Android 13+ shows the
 * notification permission prompt only after the app has created one, so this runs at startup.
 */
export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ARRIVAL_CHANNEL, {
    name: 'Arrival alerts',
    description: 'Tells you when you reach a stop on the walk.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}
setupNotificationChannel().catch(() => undefined);

/**
 * The OS can wake the app in the background with nothing loaded yet. The saved walk,
 * settings and purchase must be read back from storage before deciding anything.
 */
async function storesReady() {
  await Promise.all(
    [useProgress, useSettings, useAccount].map((s) => (s.persist.hasHydrated() ? undefined : s.persist.rehydrate())),
  );
}

/** Clear the last arrival alert, for example when the walk ends. */
export function clearArrivalAlert() {
  return Notifications.dismissNotificationAsync(ARRIVAL_NOTIFICATION_ID).catch(() => undefined);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background task definitions must run at module load, before any screen mounts.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { eventType, region } = data as { eventType: Location.GeofencingEventType; region: Location.LocationRegion };
  if (eventType !== Location.GeofencingEventType.Enter || !region.identifier) return;
  const [walkId, idxStr] = region.identifier.split('|');
  const index = Number(idxStr);
  const walk = getWalk(walkId);
  const stop = walk?.stops[index];
  if (!walk || !stop) return;
  await storesReady();
  const prog = useProgress.getState().progress[walkId];
  // Ignore fences left over from a walk that has ended, stops already reached,
  // stops behind the walker, locked stops, and alerts the walker turned off.
  if (useProgress.getState().activeWalkId !== walkId || !prog) return;
  if (prog.visited.includes(index) || index < prog.current) return;
  if (!canOpenStop(walkId, index, useAccount.getState().isPro)) return;
  if (!useSettings.getState().arrivalAlerts) return;
  useProgress.getState().markVisited(walkId, index);
  useProgress.getState().goTo(walkId, index);
  LiveActivity.update(walk, index);
  // Move the fences on to the stops ahead.
  await Location.startGeofencingAsync(GEOFENCE_TASK, regionsFrom(walk, index + 1)).catch(() => undefined);
  if (AppState.currentState !== 'active') {
    await Notifications.scheduleNotificationAsync({
      identifier: ARRIVAL_NOTIFICATION_ID,
      content: {
        title: `You've arrived: ${stop.title}`,
        body: `Stop ${stop.n} of Walk ${walk.id}, ${walk.title}.`,
        data: { url: `/walk/${walkId}/go?stop=${index}` },
        threadIdentifier: `walk-${walkId}`,
      },
      trigger: Platform.OS === 'android' ? { channelId: ARRIVAL_CHANNEL } : null,
    });
  }
});

TaskManager.defineTask(LOCATION_TASK, async () => {
  // Keeps the Android foreground service (and its ongoing notification) alive during a walk.
});

export async function requestPermissions(): Promise<{ foreground: boolean; background: boolean }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { foreground: false, background: false };
  await setupNotificationChannel().catch(() => undefined); // must exist before the Android 13+ prompt
  await Notifications.requestPermissionsAsync();
  const bg = await Location.requestBackgroundPermissionsAsync().catch(() => ({ status: 'denied' as const }));
  return { foreground: true, background: bg.status === 'granted' };
}

function regionsFrom(walk: Walk, fromIndex: number): Location.LocationRegion[] {
  const radius = useSettings.getState().arrivalRadius || DEFAULT_ARRIVAL_RADIUS_M;
  const isPro = useAccount.getState().isPro;
  const rest = walk.stops.map((s, k) => ({ s, k })).slice(fromIndex);
  // Stop at the next look-at stop: the walker taps Next through those, so later stops must not fire first.
  const look = rest.findIndex(({ s }, j) => j > 0 && s.look);
  return (look > 0 ? rest.slice(0, look) : rest)
    .filter(({ s }) => !s.look)
    .filter(({ s }) => onMap(s)) // no arrival alert for a stop her map doesn't print
    .filter(({ k }) => canOpenStop(walk.id, k, isPro)) // no alert for a locked stop, as on the walk screen
    .slice(0, MAX_REGIONS)
    .map(({ s, k }) => ({
    identifier: `${walk.id}|${k}`,
    latitude: s.lat,
    longitude: s.lng,
    // OS geofences are unreliable under about 100 m, so the background radius is larger;
    // the foreground watcher uses the walker's chosen radius.
    radius: Math.max(100, s.radius ?? radius),
    notifyOnEnter: true,
    notifyOnExit: false,
  }));
}

export async function startBackground(walk: Walk, fromIndex: number) {
  const { arrivalAlerts } = useSettings.getState();
  if (!arrivalAlerts) return;
  const perm = await Location.getBackgroundPermissionsAsync();
  if (perm.status !== 'granted') return;
  await Location.startGeofencingAsync(GEOFENCE_TASK, regionsFrom(walk, fromIndex));
  await startUpdates(walk, fromIndex);
}

/**
 * Starts (or restarts) the background location updates. On Android their foreground-service notification is the
 * walk's ongoing notification, and expo-location only sets its text when the updates start, so it is restarted
 * as the walker advances or switches walks to keep the title and next stop current.
 */
async function startUpdates(walk: Walk, index: number) {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => undefined);
  }
  const stop = walk.stops[index];
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 25,
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: `Walking: ${walk.title}`,
      notificationBody: stop ? `Next: stop ${stop.n}, ${stop.title}` : 'You will get an alert when you reach a stop on the map.',
      notificationColor: '#0E6E74',
    },
  });
}

/** Re-arm geofences as the walker progresses (keeps the next stops inside the iOS limit). */
export async function advanceBackground(walk: Walk, index: number) {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
    await Location.startGeofencingAsync(GEOFENCE_TASK, regionsFrom(walk, index));
    if (Platform.OS === 'android') await startUpdates(walk, index).catch(() => undefined);
  }
}

export async function stopBackground() {
  await clearArrivalAlert();
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)) await Location.stopGeofencingAsync(GEOFENCE_TASK);
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

export function watchForeground(cb: (pos: Location.LocationObject) => void) {
  return Location.watchPositionAsync(
    { accuracy: Platform.OS === 'ios' ? Location.Accuracy.BestForNavigation : Location.Accuracy.High, distanceInterval: 4, timeInterval: 2000 },
    cb,
  );
}
