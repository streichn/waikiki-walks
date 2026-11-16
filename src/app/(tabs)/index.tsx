import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus, Monstera, Plumeria, WaveRule } from '../../components/Flora';
import { FunFacts } from '../../components/FunFacts';
import { SmartCard } from '../../components/SmartCard';
import { T, tap } from '../../components/ui';
import { WalkCard } from '../../components/WalkCard';
import { TRIAL } from '../../config';
import { getWalk, photo, walks } from '../../data';
import { useAccount } from '../../store';
import { APP_COPYRIGHT, DEDICATION } from '../../legal';
import { useTheme } from '../../theme';


export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const name = useAccount((s) => s.profile?.name);
  const trial = getWalk(TRIAL.walkId)!;
  const hero = walks.find((w) => w.id === 'III')?.cover ?? trial.cover;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Aloha kakahiaka' : hour < 17 ? 'Aloha ʻauinalā' : 'Aloha ahiahi';

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        {hero ? <Image source={photo(hero)} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
        <LinearGradient colors={['rgba(4,30,34,0.35)', 'rgba(4,30,34,0.15)', t.bg]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.flowerTL}>
          <Hibiscus size={92} rotate={-20} color={t.palette.hibiscus} />
        </View>
        <View style={styles.flowerTR}>
          <Plumeria size={54} rotate={14} />
        </View>
        <View style={styles.heroTop}>
          <Pressable accessibilityLabel="What am I looking at?" onPress={() => router.push('/lens')} style={styles.heroBtn}>
            <Ionicons name="scan" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 'auto' }}>
          <T style={{ color: t.text, fontFamily: t.font.displayItalic, fontSize: 18 }}>
            {greet}
            {name ? `, ${name.split(' ')[0]}` : ''}
          </T>
          <T variant="display" style={{ fontSize: 40, lineHeight: 44 }}>
            Waikīkī
          </T>
          <T style={{ fontFamily: t.font.display, fontSize: 18, letterSpacing: 3, color: t.text }}>TWELVE WALKS THROUGH TIME</T>
          <T variant="small" style={{ marginTop: 4 }}>
            by Veneeta Acson, Ph.D.
          </T>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 18 }}>
        <SmartCard />

        <FunFacts />

        <View style={{ gap: 12 }}>
          <View>
            <T variant="title" style={{ fontSize: 22 }}>
              The twelve walks
            </T>
            <WaveRule width={90} color={t.primary} />
          </View>
          {walks.map((w) => (
            <WalkCard key={w.id} walk={w} wide />
          ))}
        </View>

        <Pressable onPress={() => router.push('/about')} style={[styles.about, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
          <View style={styles.leaf}>
            <Monstera size={130} color={t.leaf} opacity={0.22} rotate={20} />
          </View>
          <T variant="h2">About the book and the author</T>
          <T variant="small" style={{ marginTop: 4, color: t.text }}>
            How to read the directions (mauka, makai, ʻEwa, Diamond Head), the Hawaiian alphabet, and the story behind these walks.
          </T>
        </Pressable>
        <View style={{ alignItems: 'center', gap: 4, marginTop: 6 }}>
          <T variant="italic" style={{ color: t.leaf }}>
            {DEDICATION}
          </T>
          <Pressable onPress={() => router.push('/credits')}>
            <T variant="small">{APP_COPYRIGHT} · Credits</T>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 380, marginBottom: 8 },
  heroTop: { position: 'absolute', right: 16, top: 54 },
  heroBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  flowerTL: { position: 'absolute', left: -26, top: 70, opacity: 0.95 },
  flowerTR: { position: 'absolute', right: 70, top: 120 },
  start: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 18 },
  about: { borderRadius: 20, padding: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  leaf: { position: 'absolute', right: -30, bottom: -40 },
});
