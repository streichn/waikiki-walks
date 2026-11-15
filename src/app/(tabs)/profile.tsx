import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus } from '../../components/Flora';
import { Button, Card, T } from '../../components/ui';
import { walks } from '../../data';
import { signOut, updateDisplayName } from '../../lib/auth';
import { manageSubscriptionUrl } from '../../lib/purchases';
import { useAccount, useProgress } from '../../store';
import { useTheme } from '../../theme';

export default function Profile() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAccount((s) => s.profile);
  const isPro = useAccount((s) => s.isPro);
  const progress = useProgress((s) => s.progress);
  const finished = Object.values(progress).filter((p) => p.finishedAt).length;
  const visited = Object.values(progress).reduce((a, p) => a + p.visited.length, 0);
  const totalStops = walks.reduce((a, w) => a + w.stops.length, 0);
  const signedIn = profile && profile.provider !== 'guest';
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 140, gap: 16 }}>
      <View style={styles.head}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Hibiscus size={52} color={t.accent} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          {editing ? (
            <TextInput
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={async () => {
                setEditing(false);
                await updateDisplayName(name.trim()).catch((e) => Alert.alert('Could not save', String(e?.message ?? e)));
              }}
              style={{ fontFamily: t.font.display, fontSize: 24, color: t.text, borderBottomWidth: 1, borderColor: t.primary, paddingVertical: 2 }}
              accessibilityLabel="Display name"
            />
          ) : (
            <Pressable disabled={!signedIn} onPress={() => { setName(profile?.name ?? ''); setEditing(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <T variant="title">{signedIn ? profile?.name || 'Walker' : 'Guest walker'}</T>
              {signedIn ? <Ionicons name="pencil" size={16} color={t.textMuted} /> : null}
            </Pressable>
          )}
          <T variant="small">{signedIn ? profile?.email : 'Sign in to save your progress across devices'}</T>
        </View>
      </View>

      {!signedIn ? <Button label="Sign in or create account" icon="log-in" onPress={() => router.push('/auth')} /> : null}

      <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Stat n={finished} label="Walks finished" />
        <Stat n={visited} label="Stops visited" />
        <Stat n={Math.round((visited / Math.max(1, totalStops)) * 100)} label="% of the book" />
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={isPro ? 'ribbon' : 'lock-open'} size={20} color={isPro ? t.gold : t.primary} />
          <T variant="h2">{isPro ? 'All twelve walks unlocked' : 'Free preview'}</T>
        </View>
        <T variant="small">{isPro ? 'Mahalo for supporting the book.' : 'Unlock every walk, every stop, read-aloud narration, and offline maps.'}</T>
        {isPro ? (
          <Button
            kind="outline"
            label="Manage subscription"
            onPress={async () => {
              const url = await manageSubscriptionUrl();
              if (url) Linking.openURL(url);
            }}
          />
        ) : (
          <Button kind="accent" icon="sparkles" label="Unlock all walks" onPress={() => router.push('/paywall')} />
        )}
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Row icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
        <Row icon="scan-outline" label="What am I looking at?" onPress={() => router.push('/lens')} />
        <Row icon="book-outline" label="About the book" onPress={() => router.push('/about')} />
        <Row icon="ribbon-outline" label="Credits and copyright" onPress={() => router.push('/credits')} />
        <Row icon="mail-outline" label="Send feedback" onPress={() => Linking.openURL('mailto:?subject=Waik%C4%AB%C4%AB%20Walks%20feedback')} last={!signedIn} />
        {signedIn ? <Row icon="log-out-outline" label="Sign out" onPress={signOut} last /> : null}
      </Card>
    </ScrollView>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <T style={{ fontFamily: t.font.display, fontSize: 28, color: t.primary }}>{n}</T>
      <T variant="small">{label}</T>
    </View>
  );
}

function Row({ icon, label, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; last?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }]}>
      <Ionicons name={icon} size={22} color={t.primary} />
      <T style={{ flex: 1 }}>{label}</T>
      <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
});
