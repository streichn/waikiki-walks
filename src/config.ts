// Product decisions live here so they can change without touching screens.

/** The free taste: one walk, opened partway. Everything else needs the subscription. */
export const TRIAL = {
  walkId: 'IV', // Kalākaua Avenue, the walk most visitors are already standing on
  freeStops: 5, // stops 1 to 5 are free; the paywall appears when the walker reaches stop 6
};

/** Every walk shows its overview, map, and first stop title for free so people can browse. */
export const BROWSE_PREVIEW_STOPS = 1;

/** RevenueCat: create these in the RevenueCat dashboard, then paste the public SDK keys into .env */
export const REVENUECAT = {
  entitlement: 'all_walks',
  iosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  androidKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
};

/** Supabase handles accounts (Apple, Google, email). Free tier is enough to start. */
export const SUPABASE = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const GOOGLE = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
};

/** Optional server endpoint for camera identification ("What am I looking at?"). */
export const LENS_ENDPOINT = process.env.EXPO_PUBLIC_LENS_ENDPOINT ?? '';

export const DEFAULT_ARRIVAL_RADIUS_M = 35;
