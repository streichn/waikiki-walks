import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StopSection } from '../../../../components/StopPage';
import { IconButton, T, tap } from '../../../../components/ui';
import { getWalk } from '../../../../data';
import type { Stop } from '../../../../data/types';
import { canOpenStop, useIsPro } from '../../../../lib/access';
import { stop as stopSpeech } from '../../../../lib/narration';
import { useTheme } from '../../../../theme';

/**
 * Read a walk one stop at a time, like turning pages: swipe sideways or use Previous and Next.
 * Each page scrolls on its own, so a long stop never runs into the next one.
 */
export default function StopReader() {
  const { id, n } = useLocalSearchParams<{ id: string; n: string }>();
  const walk = getWalk(id)!;
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isPro = useIsPro();
  const [index, setIndex] = useState(Math.max(0, Math.min(walk.stops.length - 1, Number(n) || 0)));
  const list = useRef<FlatList<Stop>>(null);

  const turnTo = (i: number) => {
    if (i < 0 || i >= walk.stops.length || i === index) return;
    tap();
    stopSpeech();
    setIndex(i);
    list.current?.scrollToIndex({ index: i, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        ref={list}
        data={walk.stops}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        windowSize={3}
        keyExtractor={(s) => s.id}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) {
            stopSpeech();
            setIndex(i);
          }
        }}
        renderItem={({ item, index: i }) => (
          <ScrollView style={{ width }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 74, paddingBottom: insets.bottom + 110 }}>
            <T variant="label" style={{ marginBottom: 6 }}>
              Stop {item.n} of {walk.stops.length}
            </T>
            <StopSection
              stop={item}
              index={i}
              locked={!canOpenStop(walk.id, i, isPro)}
              walkColor={walk.color}
              width={width}
              onMap={() => {
                stopSpeech();
                router.navigate({ pathname: '/walk/[id]', params: { id: walk.id, stop: String(i), mode: 'map' } });
              }}
            />
          </ScrollView>
        )}
      />

      <View style={[styles.top, { top: insets.top + 6 }]}>
        <IconButton icon="chevron-back" label="All stops" onPress={() => { stopSpeech(); router.back(); }} />
        <View style={[styles.pill, { backgroundColor: t.card }]}>
          <T variant="label" numberOfLines={1}>Walk {walk.id}</T>
          <T style={{ fontFamily: t.font.display, fontSize: 15 }} numberOfLines={1}>{walk.title}</T>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.pager, { paddingBottom: insets.bottom + 12, backgroundColor: t.bg, borderTopColor: t.border }]}>
        <PageButton label="Previous" icon="chevron-back" disabled={index === 0} onPress={() => turnTo(index - 1)} />
        <T style={{ fontFamily: t.font.bodyBold, color: t.textMuted }}>
          {walk.stops[index].n} / {walk.stops.length}
        </T>
        <PageButton label="Next" icon="chevron-forward" iconRight disabled={index === walk.stops.length - 1} onPress={() => turnTo(index + 1)} />
      </View>
    </View>
  );
}

function PageButton({ label, icon, iconRight, disabled, onPress }: { label: string; icon: 'chevron-back' | 'chevron-forward'; iconRight?: boolean; disabled?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} stop`} disabled={disabled} onPress={onPress} style={[styles.pbtn, { backgroundColor: t.cardAlt, opacity: disabled ? 0.35 : 1 }]}>
      {!iconRight ? <Ionicons name={icon} size={18} color={t.primary} /> : null}
      <T style={{ fontFamily: t.font.bodyBold, color: t.primary }}>{label}</T>
      {iconRight ? <Ionicons name={icon} size={18} color={t.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: { flex: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  pager: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  pbtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14 },
});
