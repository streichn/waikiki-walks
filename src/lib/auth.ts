import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { GOOGLE, SUPABASE } from '../config';
import { type Profile, useAccount, useProgress } from '../store';
import { linkUser, unlinkUser } from './purchases';

/**
 * Accounts are optional: Apple's guidelines say an app should not force registration
 * for features that don't need an account. Walkers can browse and take the free walk as
 * guests; signing in syncs progress and purchases across devices.
 * Apple also requires Sign in with Apple whenever Google sign-in is offered.
 */

export const supabase: SupabaseClient | null =
  SUPABASE.url && SUPABASE.anonKey
    ? createClient(SUPABASE.url, SUPABASE.anonKey, {
        // AsyncStorage, as in Supabase's Expo guide: SecureStore caps values at 2 KB and sessions exceed it.
        auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

export const authReady = Boolean(supabase);

// Refresh the session only while the app is in the foreground (Supabase's recommended pattern).
AppState.addEventListener('change', (state) => {
  if (!supabase) return;
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

if (GOOGLE.webClientId) {
  GoogleSignin.configure({ webClientId: GOOGLE.webClientId, iosClientId: GOOGLE.iosClientId || undefined });
}

async function finish(profile: Profile) {
  useAccount.getState().setProfile(profile);
  await linkUser(profile.id);
  return profile;
}

export async function signInWithApple(): Promise<Profile | null> {
  if (!supabase) throw new Error('Accounts are not configured yet.');
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashedNonce,
  });
  if (!cred.identityToken) return null;
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: rawNonce });
  if (error || !data.user) throw error ?? new Error('Apple sign-in failed');
  const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ') || data.user.user_metadata?.full_name;
  return finish({ id: data.user.id, name, email: data.user.email, provider: 'apple' });
}

export async function signInWithGoogle(): Promise<Profile | null> {
  if (!supabase) throw new Error('Accounts are not configured yet.');
  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
  try {
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success' || !res.data.idToken) return null;
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: res.data.idToken });
    if (error || !data.user) throw error ?? new Error('Google sign-in failed');
    return finish({ id: data.user.id, name: res.data.user.name, email: res.data.user.email, avatarUrl: res.data.user.photo, provider: 'google' });
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw e;
  }
}

export async function sendEmailLink(email: string) {
  if (!supabase) throw new Error('Accounts are not configured yet.');
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'waikikiwalks://auth' } });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  if (!supabase) throw new Error('Accounts are not configured yet.');
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error || !data.user) throw error ?? new Error('That code did not work');
  return finish({ id: data.user.id, email: data.user.email, provider: 'email' });
}

/** The only profile detail we ask for: the name shown in the app. Optional. */
export async function updateDisplayName(name: string) {
  const p = useAccount.getState().profile;
  if (!p || p.provider === 'guest') return;
  useAccount.getState().setProfile({ ...p, name });
  if (supabase) {
    const { error } = await supabase.from('profiles').update({ display_name: name || null, updated_at: new Date().toISOString() }).eq('id', p.id);
    if (error) throw error;
  }
}

export function continueAsGuest() {
  useAccount.getState().setProfile({ id: 'guest', provider: 'guest', name: 'Guest' });
}

export async function signOut() {
  await supabase?.auth.signOut();
  await GoogleSignin.signOut().catch(() => undefined);
  await unlinkUser();
  useAccount.getState().setProfile(undefined);
}

export type DeleteResult = {
  /** false when an Apple account's tokens could not be revoked; show the manual step. */
  appleRevoked: boolean | null;
};

/**
 * Account deletion, the standard way (Apple Guideline 5.1.1(v), Apple TN3194, Google Play
 * account deletion policy):
 *  - Apple accounts: ask the walker to confirm with Apple once more. That gives a fresh,
 *    single-use authorization code, which the server exchanges and revokes. It also confirms
 *    that the person holding the phone is the account owner.
 *  - Google accounts: revoke the app's Google access on the device.
 *  - The server function "delete-account" (server/delete-account.ts) deletes the user;
 *    synced progress, saved stops and settings go with it (on delete cascade).
 *  - Then everything this account left on the phone is cleared, and the walker is signed out.
 * Purchases are not affected: they belong to the walker's Apple ID or Google account and come
 * back with Restore purchases.
 * Throws if the server could not delete the account, so the screen can say so.
 * Returns null if the walker cancelled the Apple confirmation.
 */
export async function deleteAccount(): Promise<DeleteResult | null> {
  const profile = useAccount.getState().profile;
  if (!supabase || !profile || profile.provider === 'guest') {
    await signOut();
    return { appleRevoked: null };
  }

  let appleAuthorizationCode: string | undefined;
  if (profile.provider === 'apple' && Platform.OS === 'ios') {
    try {
      const cred = await AppleAuthentication.signInAsync({ requestedScopes: [] });
      appleAuthorizationCode = cred.authorizationCode ?? undefined;
    } catch (e: unknown) {
      if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'ERR_REQUEST_CANCELED') return null;
      // Apple could not be reached: still delete the account, and show the manual revoke step.
    }
  }

  const { data, error } = await supabase.functions.invoke<{ ok: boolean; appleRevoked: boolean | null }>('delete-account', {
    body: appleAuthorizationCode ? { appleAuthorizationCode } : {},
  });
  if (error || !data?.ok) throw new Error('We could not delete your account just now. Please check your connection and try again.');

  if (profile.provider === 'google') await GoogleSignin.revokeAccess().catch(() => undefined);
  useProgress.getState().reset();
  await signOut();
  return { appleRevoked: data.appleRevoked };
}

/** Apple's page that explains how to stop using Sign in with Apple for an app. */
export const APPLE_MANUAL_REVOKE_URL = 'https://support.apple.com/en-us/102571';

/**
 * If the walker stops using Sign in with Apple for this app (in iPhone Settings), Apple tells the
 * app. TN3194 says to return to a signed-out state when that happens.
 */
if (Platform.OS === 'ios') {
  try {
    AppleAuthentication.addRevokeListener(() => {
      if (useAccount.getState().profile?.provider === 'apple') signOut().catch(() => undefined);
    });
  } catch {
    // Not available (for example on the simulator without Apple sign-in); nothing to listen for.
  }
}
