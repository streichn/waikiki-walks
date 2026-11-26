import Slider from '../components/Slider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, AppState, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import type * as Speech from 'expo-speech';
import { Card, Segmented, T } from '../components/ui';
import { APPLE_MANUAL_REVOKE_URL, deleteAccount } from '../lib/auth';
import { englishVoices, speakShort } from '../lib/narration';
import { restore } from '../lib/purchases';
import { type ThemeMode, useAccount, useProgress, useSettings } from '../store';
import { APP_COPYRIGHT, LINKS } from '../legal';
import { useTheme } from '../theme';

export default function Settings() {
  const t = useTheme();
  const s = useSettings();
  const profile = useAccount((x) => x.profile);
  const resetProgress = useProgress((x) => x.reset);
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  useEffect(() => {
    englishVoices().then(setVoices).catch(() => undefined);
  }, []);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 60 }}>
      <Section title="Appearance">
        <Segmented<ThemeMode>
          value={s.themeMode}
          onChange={(v) => s.set({ themeMode: v })}
          options={[
            { value: 'system', label: 'Auto', icon: 'phone-portrait' },
            { value: 'light', label: 'Light', icon: 'sunny' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
          ]}
        />
      </Section>

      <Section title="Reading">
        <Segmented<'comfortable' | 'compact'>
          value={s.textScale <= 0.95 && s.sideMargin <= 10 && s.lineSpacing <= 0.95 ? 'compact' : 'comfortable'}
          onChange={(v) => s.set(v === 'compact' ? { textScale: 0.95, sideMargin: 10, lineSpacing: 0.92 } : { textScale: 1, sideMargin: 20, lineSpacing: 1 })}
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'More words per screen' },
          ]}
        />
        <T variant="small" style={{ marginTop: 12 }}>
          Text size
        </T>
        <Slider value={s.textScale} min={0.85} max={1.6} step={0.05} onChange={(v) => s.set({ textScale: v })} />
        <T variant="small" style={{ marginTop: 8 }}>
          Side margins
        </T>
        <Slider value={s.sideMargin} min={6} max={28} step={2} onChange={(v) => s.set({ sideMargin: v })} />
        <T variant="small" style={{ marginTop: 8 }}>
          Line spacing
        </T>
        <Slider value={s.lineSpacing} min={0.9} max={1.4} step={0.05} onChange={(v) => s.set({ lineSpacing: v })} />
        <View style={{ marginHorizontal: -16, paddingHorizontal: s.sideMargin }}>
          <T>Aloha ʻāina, love of the land. Walk down Kalākaua Avenue toward the sea, and the old fishponds of Waikīkī lie beneath your feet.</T>
        </View>
      </Section>

      <Section title="Walking">
        <Toggle label="Arrival alerts" hint="Tell me when I reach a stop" value={s.arrivalAlerts} onChange={(v) => s.set({ arrivalAlerts: v })} />
        {s.arrivalAlerts ? <AlertsStatus /> : null}
        <T variant="small" style={{ marginTop: 8 }}>
          Arrival distance: {s.arrivalRadius} m (about {Math.round(s.arrivalRadius * 3.28)} ft)
        </T>
        <Slider value={s.arrivalRadius} min={15} max={80} step={5} onChange={(v) => s.set({ arrivalRadius: v })} />
        <Toggle label="Haptics" hint="A gentle buzz on arrival" value={s.haptics} onChange={(v) => s.set({ haptics: v })} />
        <Segmented<'imperial' | 'metric'>
          value={s.units}
          onChange={(v) => s.set({ units: v })}
          options={[
            { value: 'imperial', label: 'Miles / feet' },
            { value: 'metric', label: 'Kilometers / meters' },
          ]}
        />
      </Section>

      <Section title="Read aloud">
        <Toggle label="Read each stop on arrival" hint="Great with headphones" value={s.autoNarrate} onChange={(v) => s.set({ autoNarrate: v })} />
        <T variant="small" style={{ marginTop: 8 }}>
          Speed: {s.speechRate.toFixed(2)}×
        </T>
        <Slider value={s.speechRate} min={0.7} max={1.3} step={0.05} onChange={(v) => s.set({ speechRate: v })} />
        <T variant="small" style={{ marginTop: 8 }}>
          Voice
        </T>
        <View style={{ gap: 6 }}>
          {[{ identifier: undefined as string | undefined, name: 'Phone default', quality: 'Default' }, ...voices.slice(0, 8)].map((v) => (
            <Pressable
              key={v.identifier ?? 'default'}
              onPress={() => {
                s.set({ voiceId: v.identifier });
                setTimeout(() => speakShort('Aloha! Welcome to Waikīkī.'), 50);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: s.voiceId === v.identifier }}
              accessibilityLabel={`${v.name}${v.quality === 'Enhanced' ? ', enhanced' : ''}`}
              style={[styles.voice, { borderColor: s.voiceId === v.identifier ? t.accent : t.border, backgroundColor: t.card }]}
            >
              <Ionicons name={s.voiceId === v.identifier ? 'radio-button-on' : 'radio-button-off'} size={18} color={t.accent} />
              <T style={{ flex: 1 }}>{v.name}</T>
              {v.quality === 'Enhanced' ? <T variant="small">Enhanced</T> : null}
            </Pressable>
          ))}
        </View>
        <T variant="small">Tip: download "Enhanced" or "Premium" voices in iPhone Settings › Accessibility › Spoken Content › Voices for a more natural reading.</T>
      </Section>

      <Section title="Without signal">
        <T variant="small">The walk text, photos, pins, the book's walk maps, GPS, and arrival alerts are stored on your phone and work with no signal.</T>
        <T variant="small">Street and satellite maps come from Apple Maps or Google Maps and need a connection. Areas you have viewed recently may stay saved for a while.</T>
        <T variant="small">If you are avoiding roaming charges, turn off mobile data instead of using Airplane mode. On some phones, Airplane mode also turns off GPS.</T>
        <T variant="small">Progress you make offline is kept on your phone. If you are signed in, it is copied to your account when you are back online.</T>
      </Section>

      <Section title="Purchases">
        <Row label="Restore purchases" onPress={async () => Alert.alert((await restore().catch(() => false)) ? 'Restored' : 'Nothing to restore')} />
        <Row label="Manage subscription" onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')} />
      </Section>

      <Section title="About">
        <Row label="Credits and copyright" onPress={() => router.push('/credits')} />
        <Row label="Privacy policy" onPress={() => Linking.openURL(LINKS.privacy)} />
        <Row label="Terms of use" onPress={() => Linking.openURL(LINKS.terms)} />
      </Section>

      <Section title="Privacy and data">
        <T variant="small" style={{ color: t.text }}>
          Your data is stored securely. If you sign in, we keep only your name, email, walk progress, saved stops, and settings. It is encrypted in storage and in transit, and only you can access your records.
        </T>
        <T variant="small">
          Your location stays on your phone and is never sent to us. Payments are handled by Apple or Google; we never see card details. You can delete your account and data at any time below.
        </T>
        <Row label="Location permission" onPress={() => Linking.openSettings()} />
        <Row
          label="Reset walk progress"
          onPress={() =>
            Alert.alert('Reset progress?', 'This clears visited stops on this device.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetProgress },
            ])
          }
        />
        {profile && profile.provider !== 'guest' ? (
          <Row
            danger
            label="Delete my account"
            onPress={() =>
              Alert.alert(
                'Delete your account?',
                'This permanently deletes your account, synced progress, saved stops, and settings. It cannot be undone.\n\nYour purchases stay with your ' +
                  (Platform.OS === 'ios' ? 'Apple ID' : 'Google account') +
                  '. Use Restore purchases to get them back later.' +
                  (profile.provider === 'apple' ? '\n\nApple will ask you to confirm once more.' : ''),
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const res = await deleteAccount();
                        if (!res) return; // cancelled the Apple confirmation
                        if (res.appleRevoked === false) {
                          Alert.alert(
                            'Account deleted',
                            'One more step: to fully disconnect Sign in with Apple, open Settings on your iPhone, tap your name, then Sign in with Apple. Choose Waikīkī Walks and tap Delete.',
                            [
                              { text: 'How to', onPress: () => Linking.openURL(APPLE_MANUAL_REVOKE_URL) },
                              { text: 'Done', onPress: () => router.back() },
                            ],
                          );
                        } else {
                          Alert.alert('Account deleted', 'Your account and synced data have been deleted.', [{ text: 'OK', onPress: () => router.back() }]);
                        }
                      } catch (e) {
                        Alert.alert('Not deleted', e instanceof Error ? e.message : 'Please try again.');
                      }
                    },
                  },
                ],
              )
            }
          />
        ) : null}
      </Section>
      <T variant="small" style={{ textAlign: 'center' }}>
        Waikīkī Walks 0.1 · {APP_COPYRIGHT}
      </T>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T variant="label">{title}</T>
      <Card style={{ gap: 10 }}>{children}</Card>
    </View>
  );
}

/**
 * If the phone blocks what arrival alerts need, say so in plain words and offer the
 * phone's Settings. Nothing shows before the walker has been asked (that happens when a walk starts).
 */
function AlertsStatus() {
  const t = useTheme();
  const [notes, setNotes] = useState<string[]>([]);
  useEffect(() => {
    const check = async () => {
      const out: string[] = [];
      const n = await Notifications.getPermissionsAsync().catch(() => undefined);
      if (n && n.status === 'denied') out.push('Notifications are off for Waikīkī Walks, so arrival alerts show only while the app is open.');
      const fg = await Location.getForegroundPermissionsAsync().catch(() => undefined);
      const bg = await Location.getBackgroundPermissionsAsync().catch(() => undefined);
      if (fg?.status === 'granted' && bg?.status === 'denied') {
        out.push(
          Platform.OS === 'ios'
            ? 'Location is set to While Using the App. Choose Always to get alerts with your phone in your pocket.'
            : 'Location is allowed only while using the app. Choose Allow all the time to get alerts with your phone in your pocket.',
        );
      } else if (fg?.status === 'denied') {
        out.push('Location is off for Waikīkī Walks. You can still walk with the Next button.');
      }
      setNotes(out);
    };
    check();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, []);
  if (!notes.length) return null;
  return (
    <View style={{ marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.border, gap: 6 }} accessibilityRole="summary">
      {notes.map((x) => (
        <T key={x} variant="small">
          {x}
        </T>
      ))}
      <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
        <T style={{ color: t.primary, fontFamily: t.font.bodyBold }}>Open phone Settings</T>
      </Pressable>
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <T>{label}</T>
        {hint ? <T variant="small">{hint}</T> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: t.primary, false: t.border }} accessibilityLabel={label} accessibilityHint={hint} />
    </View>
  );
}

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, minHeight: 44 }}>
      <T style={{ flex: 1, color: danger ? t.danger : t.text }}>{label}</T>
      <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  voice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
});
