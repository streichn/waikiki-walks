import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus, Plumeria } from '../components/Flora';
import { Button, IconButton, T, tap } from '../components/ui';
import { photo, walks } from '../data';
import { buy, formatPassEnd, isConfigured, loadPackages, passEnd, restore } from '../lib/purchases';
import { LINKS } from '../legal';
import { BROWSE_PREVIEW_STOPS, PLANS, TRIAL } from '../config';
import { useAccount } from '../store';
import { useTheme } from '../theme';

// Plan wording: say what you get, for how long, and that nothing renews (App Store guideline 3.1.2:
// "clearly describe what the user will get for the price"). Badges must be literally true.
const WEEK = { title: '7-day pass', note: 'All 12 walks for 7 days from purchase. Never renews.', badge: null };
const FOREVER = { title: 'Yours forever', note: 'All 12 walks, on this trip and every visit after. One payment.', badge: 'NEVER EXPIRES' };

// Shown only until the store products exist; real prices always come from the store.
const PLACEHOLDER = [
  { id: PLANS.weekPass.productId, productId: PLANS.weekPass.productId, price: PLANS.weekPass.fallbackPrice, ...WEEK },
  { id: PLANS.forever.productId, productId: PLANS.forever.productId, price: PLANS.forever.fallbackPrice, ...FOREVER },
];

function describe(p: PurchasesPackage) {
  const id = p.product.identifier;
  if (id === PLANS.weekPass.productId) return WEEK;
  if (id === PLANS.forever.productId) return FOREVER;
  return { title: p.product.title, note: p.product.description, badge: null };
}

/** What stays free without paying, worded from the product rules in config.ts. */
const FREE_LINE = `Free without paying: Walk ${TRIAL.walkId}, stops 1 to ${TRIAL.freeStops}, plus the overview, map and ${
  BROWSE_PREVIEW_STOPS === 1 ? 'first stop' : `first ${BROWSE_PREVIEW_STOPS} stops`
} of every walk.`;

const PERKS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'map', text: 'All 12 walks and every stop, from Kālia to Mānoa Falls' },
  { icon: 'headset', text: 'Read-aloud narration, hands free with headphones' },
  { icon: 'notifications', text: 'Arrival alerts, even with your phone in your pocket' },
  { icon: 'cloud-offline', text: 'Works without signal: text, photos, and GPS are on your phone' },
  { icon: 'images', text: 'Historic photographs from the Hawaiʻi State Archives and the book' },
  { icon: 'cloud-offline', text: 'Stories, photos and the book maps are stored on your phone, so they work without signal' },
  { icon: 'scan', text: '"What am I looking at?" for landmarks along the way' },
];

export default function Paywall() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [pkgs, setPkgs] = useState<PurchasesPackage[]>([]);
  const [sel, setSel] = useState<string>(PLANS.forever.productId);
  const [busy, setBusy] = useState(false);
  const isPro = useAccount((s) => s.isPro);
  const passExpiry = useAccount((s) => s.passExpiry);
  const ownsForever = isPro && !passExpiry;
  const cover = walks.find((w) => w.id === 'V')?.cover;

  useEffect(() => {
    loadPackages()
      .then((p) => {
        setPkgs(p);
        const forever = p.find((x) => x.product.identifier === PLANS.forever.productId);
        if (forever) setSel(forever.identifier);
        else if (p[0]) setSel(p[0].identifier);
      })
      .catch(() => undefined);
  }, []);

  const purchase = async () => {
    const pkg = pkgs.find((p) => p.identifier === sel);
    if (!pkg) {
      Alert.alert('Store not connected yet', 'Purchases will work once the App Store and Google Play products are set up.');
      return;
    }
    setBusy(true);
    try {
      if (await buy(pkg)) {
        Alert.alert('Mahalo nui loa!', 'All twelve walks are open. Enjoy Waikīkī.');
        router.back();
      }
    } catch (e: unknown) {
      const cancelled = typeof e === 'object' && e && 'userCancelled' in e && (e as { userCancelled: boolean }).userCancelled;
      if (!cancelled) Alert.alert('Purchase did not go through', String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const plans = pkgs.length
    ? pkgs.map((p) => ({
        id: p.identifier,
        productId: p.product.identifier,
        price: p.product.priceString,
        ...describe(p),
      }))
    : PLACEHOLDER;
  const chosen = plans.find((x) => x.id === sel);

  // The fine print under the button changes with the plan, so the walker knows exactly
  // what one tap does: one charge, when a pass ends, and that nothing renews.
  const finePrint = (() => {
    if (!chosen) return 'One-time purchases. Nothing renews or charges you again.';
    if (chosen.productId === PLANS.weekPass.productId) {
      // Passes stack (see passEnd): a new pass starts when the current one ends.
      const end = passExpiry ? passExpiry + PLANS.weekPass.days * 86400000 : passEnd([Date.now()]);
      return `One charge of ${chosen.price}. ${passExpiry ? 'Adds 7 days: your pass would run' : 'Your pass would run'} until ${formatPassEnd(end ?? Date.now())}. It never renews.`;
    }
    if (chosen.productId === PLANS.forever.productId) return `One charge of ${chosen.price}. All walks stay open for good. Nothing renews.`;
    return 'One-time purchases. Nothing renews or charges you again.';
  })();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
        <View style={{ height: 260 }}>
          {cover ? <Image source={photo(cover)} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <LinearGradient colors={['rgba(0,0,0,0.2)', t.bg]} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: -20, bottom: 10 }}>
            <Hibiscus size={120} rotate={-15} color={t.palette.hibiscus} />
          </View>
          <View style={{ position: 'absolute', right: 30, bottom: 50 }}>
            <Plumeria size={60} rotate={20} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 22, marginTop: -30, gap: 14 }}>
          <T variant="display">Walk all of Waikīkī</T>
          <T variant="italic" style={{ color: t.leaf }}>
            Twelve walks through a thousand years, in Veneeta's own words.
          </T>
          {ownsForever ? (
            <View style={[styles.note, { backgroundColor: t.accentSoft }]} accessibilityRole="text">
              <Ionicons name="ribbon" size={18} color={t.gold} />
              <T style={{ flex: 1, fontSize: 15 }}>All twelve walks are already yours. Nothing more to buy.</T>
            </View>
          ) : passExpiry ? (
            <View style={[styles.note, { backgroundColor: t.accentSoft }]} accessibilityRole="text">
              <Ionicons name="time-outline" size={18} color={t.accent} />
              <T style={{ flex: 1, fontSize: 15 }}>
                Your 7-day pass runs until {formatPassEnd(passExpiry)}. Another pass adds 7 days; Yours forever keeps every walk open for good.
              </T>
            </View>
          ) : (
            <T variant="small">{FREE_LINE}</T>
          )}
          <View style={{ gap: 10, marginVertical: 6 }}>
            {PERKS.map((p) => (
              <View key={p.text} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={[styles.perkIcon, { backgroundColor: t.accentSoft }]}>
                  <Ionicons name={p.icon} size={16} color={t.accent} />
                </View>
                <T style={{ flex: 1, fontSize: 15 }}>{p.text}</T>
              </View>
            ))}
          </View>
          <View accessibilityRole="radiogroup" accessibilityLabel="Choose a plan" style={{ gap: 14 }}>
          {plans.map((p) => {
            const on = p.id === sel;
            return (
              <Pressable
                key={p.id}
                onPress={() => { tap(); setSel(p.id); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${p.title}, ${p.price}. ${p.note}`}
                style={[styles.plan, { borderColor: on ? t.accent : t.border, backgroundColor: on ? (t.dark ? '#3A1A26' : '#FFF0F4') : t.card }]}>
                <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? t.accent : t.textMuted} />
                <View style={{ flex: 1 }}>
                  <T variant="h2">{p.title}</T>
                  <T variant="small">{p.note}</T>
                </View>
                <T style={{ fontFamily: t.font.bodyBold }}>{p.price}</T>
                {p.badge ? (
                  <View style={[styles.best, { backgroundColor: t.gold }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    <T style={{ fontSize: 10, fontFamily: t.font.bodyBold, color: '#3a2200' }}>{p.badge}</T>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          </View>
          {!isConfigured() ? (
            <T variant="small" style={{ textAlign: 'center' }}>
              Preview prices. Real prices load from the App Store once products are set up.
            </T>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: t.bg, borderTopColor: t.border }]}>
        {ownsForever ? (
          <Button kind="accent" label="Back to the walks" icon="walk" onPress={() => router.back()} />
        ) : (
          <Button kind="accent" label={`${passExpiry && chosen?.productId === PLANS.weekPass.productId ? 'Add 7 days' : 'Unlock'} for ${chosen?.price ?? ''}`} icon="sparkles" onPress={purchase} loading={busy} />
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18 }}>
          <Pressable
            onPress={async () => {
              const ok = await restore().catch(() => false);
              Alert.alert(ok ? 'Purchases restored' : 'Nothing to restore', ok ? 'All walks are unlocked.' : 'No previous purchase was found for this account.');
              if (ok) router.back();
            }}
          >
            <T variant="small" style={{ textDecorationLine: 'underline' }}>
              Restore purchases
            </T>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(LINKS.terms)}>
            <T variant="small" style={{ textDecorationLine: 'underline' }}>
              Terms
            </T>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(LINKS.privacy)}>
            <T variant="small" style={{ textDecorationLine: 'underline' }}>
              Privacy
            </T>
          </Pressable>
        </View>
        {ownsForever ? null : (
          <T variant="small" style={{ textAlign: 'center', fontSize: 12 }}>
            {finePrint}
          </T>
        )}
      </View>
      <IconButton icon="close" label="Close" onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, right: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  perkIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 2 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  best: { position: 'absolute', top: -9, right: 14, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
