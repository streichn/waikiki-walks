import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { DEFAULT_ARRIVAL_RADIUS_M } from '../config';
import { arrivalRadius } from './geo';
import { getWalk } from '../data';
import type { Walk } from '../data/types';
import { useProgress, useSettings } from '../store';
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
  useProgress.getState().markVisited(walkId, index);
  useProgress.getState().goTo(walkId, index);
  LiveActivity.update(walk, index);
  if (AppState.currentState !== 'active') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `You've arrived: ${stop.title}`,
        body: `Stop ${stop.n} of Walk ${walk.id}, ${walk.title}. Tap to read or listen.`,
        data: { url: `/walk/${walkId}/go?stop=${index}` },
      },
      trigger: null,
    });
  }
});

TaskManager.defineTask(LOCATION_TASK, async () => {
  // Keeps the Android foreground service (and its ongoing notification) alive during a walk.
});

export async function requestPermissions(): Promise<{ foreground: boolean; background: boolean }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { foreground: false, background: false };
  await Notifications.requestPermissionsAsync();
  const bg = await Location.requestBackgroundPermissionsAsync().catch(() => ({ status: 'denied' as const }));
  return { foreground: true, background: bg.status === 'granted' };
}

function regionsFrom(walk: Walk, fromIndex: number): Location.LocationRegion[] {
  const radius = useSettings.getState().arrivalRadius || DEFAULT_ARRIVAL_RADIUS_M;
  return walk.stops.slice(fromIndex, fromIndex + MAX_REGIONS).map((s, k) => ({
    identifier: `${walk.id}|${fromIndex + k}`,
    latitude: s.lat,
    longitude: s.lng,
    // OS geofences are unreliable under about 100 m, so the background radius is larger;
    // the foreground watcher uses the walker's chosen radius.
    radius: Math.max(100, arrivalRadius(s, radius)),
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
  if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 25,
      activityType: Location.ActivityType.Fitness,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: `Walking: ${walk.title}`,
        notificationBody: 'Waikīkī Walks will let you know when you arrive at each stop.',
        notificationColor: '#0E6E74',
      },
    });
  }
}

/** Re-arm geofences as the walker progresses (keeps the next stops inside the iOS limit). */
export async function advanceBackground(walk: Walk, index: number) {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
    await Location.startGeofencingAsync(GEOFENCE_TASK, regionsFrom(walk, index));
  }
}

export async function stopBackground() {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)) await Location.stopGeofencingAsync(GEOFENCE_TASK);
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

export function watchForeground(cb: (pos: Location.LocationObject) => void) {
  return Location.watchPositionAsync(
    { accuracy: Platform.OS === 'ios' ? Location.Accuracy.BestForNavigation : Location.Accuracy.High, distanceInterval: 4, timeInterval: 2000 },
    cb,
  );
}
