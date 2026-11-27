import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus, Monstera } from '../components/Flora';
import { Button, IconButton, T } from '../components/ui';
import { authReady, continueAsGuest, sendEmailLink, signInWithApple, signInWithGoogle, verifyEmailCode } from '../lib/auth';
import { useTheme } from '../theme';

export default function Auth() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      const r = await fn();
      if (r) router.back();
    } catch (e: unknown) {
      Alert.alert('Sign-in problem', String((e as Error)?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ position: 'absolute', right: -40, top: 40 }}>
        <Monstera size={220} color={t.leaf} opacity={0.15} rotate={-25} />
      </View>
      <View style={[styles.wrap, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        <Hibiscus size={70} color={t.accent} />
        <T variant="display">E komo mai</T>
        <T style={{ color: t.textMuted }}>Welcome. Sign in to keep your progress, saved stops, and purchases on every device.</T>

        <View style={{ gap: 12, marginTop: 18 }}>
          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={t.dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={28}
              style={{ height: 52 }}
              onPress={() => run('apple', signInWithApple)}
            />
          ) : null}
          <Pressable accessibilityRole="button" accessibilityState={{ busy: busy === 'google' }} onPress={() => run('google', signInWithGoogle)} style={[styles.google, { backgroundColor: t.card, borderColor: t.border }]}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <T style={{ fontFamily: t.font.bodyBold }}>{busy === 'google' ? 'Connecting…' : 'Continue with Google'}</T>
          </Pressable>

          <View style={styles.or}>
            <View style={[styles.line, { backgroundColor: t.border }]} />
            <T variant="small">or use email</T>
            <View style={[styles.line, { backgroundColor: t.border }]} />
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={t.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.card, fontFamily: t.font.body }]}
          />
          {sent ? (
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code from the email"
              placeholderTextColor={t.textMuted}
              keyboardType="number-pad"
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.card, fontFamily: t.font.body }]}
            />
          ) : null}
          <Button
            kind="outline"
            label={sent ? 'Verify code' : 'Email me a sign-in code'}
            loading={busy === 'email'}
            disabled={!email.includes('@')}
            onPress={() =>
              run('email', async () => {
                if (!sent) {
                  await sendEmailLink(email.trim());
                  setSent(true);
                  return null;
                }
                return verifyEmailCode(email.trim(), code.trim());
              })
            }
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            continueAsGuest();
            router.back();
          }}
          style={{ alignSelf: 'center', marginTop: 'auto', padding: 10 }}
        >
          <T style={{ color: t.primary, fontFamily: t.font.bodyBold }}>Continue as a guest</T>
        </Pressable>
        {!authReady ? (
          <T variant="small" style={{ textAlign: 'center' }}>
            Developer note: accounts activate once the Supabase keys are added.
          </T>
        ) : null}
      </View>
      <IconButton icon="close" label="Close" onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, right: 16 }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, gap: 8 },
  google: { height: 52, borderRadius: 28, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  input: { height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
});
