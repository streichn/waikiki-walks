import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plumeria } from '../../components/Flora';
import { T } from '../../components/ui';
import { photo, walks, walkNo } from '../../data';
import { useProgress } from '../../store';
import { useTheme } from '../../theme';

export default function Saved() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const favs = useProgress((s) => s.favorites);
  const items = walks.flatMap((w) => w.stops.map((s, i) => ({ w, s, i }))).filter((x) => favs.includes(x.s.id));
  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 140, gap: 12 }}
      ListHeaderComponent={<T variant="display">Saved stops</T>}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
          <Plumeria size={80} />
          <T style={{ textAlign: 'center', color: t.textMuted }}>Tap the heart on any stop to keep it here.</T>
        </View>
      }
      data={items}
      keyExtractor={(x) => x.s.id}
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" accessibilityLabel={`Walk ${walkNo(item.w.id)}, stop ${item.s.n}: ${item.s.title}`} accessibilityHint="Opens this saved stop" onPress={() => router.push(`/walk/${item.w.id}?stop=${item.i}`)} style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}>
          {item.s.photos[0] ? <Image source={photo(item.s.photos[0].file)} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: item.w.color }]} />}
          <View style={{ flex: 1 }}>
            <T variant="label">
              Walk {walkNo(item.w.id)} · Stop {item.s.n}
            </T>
            <T variant="h2" numberOfLines={2}>
              {item.s.title}
            </T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  thumb: { width: 64, height: 64, borderRadius: 12 },
});
