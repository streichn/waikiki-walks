// Product decisions live here so they can change without touching screens.

/** The free taste: one walk, opened partway. Everything else needs the subscription. */
export const TRIAL = {
  walkId: 'IV', // Kalākaua Avenue, the walk most visitors are already standing on
  freeStops: 5, // stops 1 to 5 are free; the paywall appears when the walker reaches stop 6
};

/** Every walk shows its overview, map, and first stop title for free so people can browse. */
export const BROWSE_PREVIEW_STOPS = 1;

/**
 * Pricing, matched to Waikīkī tour apps in Nov 2026: single walking tours sell for $4.99 to $9.99
 * (VoiceMap, Shaka Guide), multi-tour passes $24.99 to $34.99, a whole-island bundle $29.99.
 * No free trial: the free part of Walk IV is the trial.
 * These are display fallbacks only; real prices come from the App Store / Google Play.
 */
export const PLANS = {
  weekPass: { productId: 'ww_week_pass', days: 7, fallbackPrice: '$9.99' }, // non-renewing: never charges again
  forever: { productId: 'ww_forever', fallbackPrice: '$34.99' }, // one-time, all walks for good
};

/** RevenueCat: create these in the RevenueCat dashboard, then paste the public SDK keys into .env */
export const REVENUECAT = {
  entitlement: 'all_walks',
  iosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  androidKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
};

/** Supabase handles accounts (Apple, Google, email). Free tier is enough to start. */
/** The publishable key is meant to ship inside the app; Row Level Security protects the data. */
export const SUPABASE = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://qufuqzmrqkqsiqvfdgjr.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_eHDQdKkCaHG4Z_EqSkNltQ_1maaGREN',
};

export const GOOGLE = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
};

/** Optional server endpoint for camera identification ("What am I looking at?"). */
export const LENS_ENDPOINT = process.env.EXPO_PUBLIC_LENS_ENDPOINT ?? '';

export const DEFAULT_ARRIVAL_RADIUS_M = 35;
