import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus, Plumeria } from '../components/Flora';
import { Button, T } from '../components/ui';
import { photo, walks } from '../data';
import { useSettings } from '../store';
import { AUTHOR, DEDICATION } from '../legal';
import { useTheme } from '../theme';

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; walk: string }[] = [
  { icon: 'flower', title: 'Twelve walks through time', body: 'From the taro fields of Kālia to the royal coconut groves of Helumoa, walk Waikīkī with the historian who wrote the book.', walk: 'III' },
  { icon: 'navigate', title: 'The walk finds you', body: 'Follow the pins. Your phone knows when you arrive and opens the story for that spot. Tap Next any time.', walk: 'IV' },
  { icon: 'headset', title: 'Listen as you go', body: 'Put in your headphones and have each stop read to you, hands free, with photographs to look at when you stop.', walk: 'VI' },
];

export default function Welcome() {
  const t = useTheme();
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

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
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
        <View style={styles.dots}>
          {SLIDES.map((_, k) => (
            <View key={k} style={[styles.dot, { backgroundColor: k === i ? t.accent : t.border, width: k === i ? 22 : 8 }]} />
          ))}
        </View>
        <Button
          label={i < SLIDES.length - 1 ? 'Next' : 'E hele kākou! Let’s go'}
          onPress={() => (i < SLIDES.length - 1 ? list.current?.scrollToIndex({ index: i + 1 }) : done())}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 24, gap: 18 },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
