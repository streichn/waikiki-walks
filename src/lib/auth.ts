import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { GOOGLE, SUPABASE } from '../config';
import { type Profile, useAccount } from '../store';
import { linkUser, unlinkUser } from './purchases';

/**
 * Accounts are optional: Apple's guidelines say an app should not force registration
 * for features that don't need an account. Walkers can browse and take the free walk as
 * guests; signing in syncs progress and purchases across devices.
 * Apple also requires Sign in with Apple whenever Google sign-in is offered.
 */

const secureStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const supabase: SupabaseClient | null =
  SUPABASE.url && SUPABASE.anonKey
    ? createClient(SUPABASE.url, SUPABASE.anonKey, {
        auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

export const authReady = Boolean(supabase);

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

export function continueAsGuest() {
  useAccount.getState().setProfile({ id: 'guest', provider: 'guest', name: 'Guest' });
}

export async function signOut() {
  await supabase?.auth.signOut();
  await GoogleSignin.signOut().catch(() => undefined);
  await unlinkUser();
  useAccount.getState().setProfile(undefined);
}

/**
 * Apple requires in-app account deletion for apps that create accounts.
 * Deleting the auth user needs the service role, so this calls a Supabase Edge Function
 * named "delete-account" (template in /server/delete-account.ts).
 */
export async function deleteAccount() {
  if (!supabase) return signOut();
  await supabase.functions.invoke('delete-account');
  await signOut();
}
