import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus, Plumeria } from '../components/Flora';
import { Button, T } from '../components/ui';
import { photo, walks } from '../data';
import { TRIAL } from '../config';
import { useSettings } from '../store';
import { AUTHOR, DEDICATION } from '../legal';
import { useTheme } from '../theme';

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; walk: string }[] = [
  { icon: 'flower', title: 'Twelve walks through time', body: 'From the taro fields of Kālia to the royal coconut groves of Helumoa, walk Waikīkī with the historian who wrote the book.', walk: 'III' },
  { icon: 'navigate', title: 'The walk finds you', body: 'Follow the pins on the book’s maps. If you allow location when you start a walk, your phone tells you when you reach a stop and opens its story. Or just tap Next.', walk: 'IV' },
  { icon: 'headset', title: 'Listen as you go', body: 'Put in your headphones and have each stop read to you, hands free, with photographs to look at when you stop.', walk: 'VI' },
];

const trialWalk = walks.find((w) => w.id === TRIAL.walkId);
// What people can do before paying, said once, plainly (the paywall says the rest).
const FREE_LINE = `Free to try: Walk ${TRIAL.walkId}${trialWalk ? `, ${trialWalk.title}` : ''}, stops 1 to ${TRIAL.freeStops}. No account needed.`;

export default function Welcome() {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const list = useRef<FlatList>(null);
  const set = useSettings((s) => s.set);

  const done = () => {
    set({ onboarded: true });
    // Guest first: people explore freely; sign-in is offered from Profile and when buying.
    router.replace('/');
  };

  const last = i === SLIDES.length - 1;
  const next = () => {
    const k = i + 1;
    // With Reduce Motion the page changes without sliding; set the page here because no scroll event follows.
    list.current?.scrollToIndex({ index: k, animated: !reduceMotion });
    setI(k);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {!last ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip"
          accessibilityHint="Skips the introduction and opens the walks"
          hitSlop={12}
          onPress={done}
          style={[styles.skip, { top: insets.top + 8, backgroundColor: t.card, borderColor: t.border }]}
        >
          <T style={{ color: t.text, fontFamily: t.font.bodyBold, fontSize: 16 }}>Skip</T>
        </Pressable>
      ) : null}
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(s) => s.title}
        renderItem={({ item }) => {
          const cover = walks.find((w) => w.id === item.walk)?.cover;
          return (
            <View style={{ width }}>
              <View style={{ height: '58%' }}>
                {cover ? <Image accessibilityIgnoresInvertColors source={photo(cover)} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                <LinearGradient colors={['transparent', t.bg]} style={StyleSheet.absoluteFill} />
                <View style={{ position: 'absolute', left: -20, bottom: -10 }}>
                  <Hibiscus size={120} rotate={-10} color={t.palette.hibiscus} />
                </View>
                <View style={{ position: 'absolute', right: 26, bottom: 40 }}>
                  <Plumeria size={56} rotate={30} />
                </View>
              </View>
              <View style={{ paddingHorizontal: 28, gap: 12 }}>
                <Ionicons name={item.icon} size={30} color={t.accent} />
                <T variant="display">{item.title}</T>
                <T style={{ color: t.textMuted, fontSize: 17, lineHeight: 25 }}>{item.body}</T>
                {item === SLIDES[SLIDES.length - 1] ? (
                  <View style={[styles.free, { borderColor: t.border, backgroundColor: t.card }]}>
                    <Ionicons name="gift-outline" size={20} color={t.leaf} />
                    <T style={{ flex: 1, color: t.text, fontSize: 16, lineHeight: 22 }}>{FREE_LINE}</T>
                  </View>
                ) : null}
                {item.walk === 'III' ? (
                  <T variant="italic" style={{ color: t.leaf, marginTop: 4 }}>
                    by {AUTHOR} · {DEDICATION}
                  </T>
                ) : null}
              </View>
            </View>
          );
        }}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots} accessible accessibilityLabel={`Page ${i + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, k) => (
            <View key={k} importantForAccessibility="no" style={[styles.dot, { backgroundColor: k === i ? t.accent : t.border, width: k === i ? 22 : 8 }]} />
          ))}
        </View>
        <Button
          label={last ? 'E hele kākou! Let’s go' : 'Next'}
          onPress={last ? done : next}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 24, gap: 18 },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { height: 8, borderRadius: 4 },
  skip: { position: 'absolute', right: 16, zIndex: 2, borderWidth: 1, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: 22 },
  free: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 6 },
});
