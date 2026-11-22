import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { photo } from '../data';
import type { Stop } from '../data/types';
import { play, stop as stopSpeech, useNarration } from '../lib/narration';
import { useProgress } from '../store';
import { readableOn, useTheme } from '../theme';
import { WaveRule } from './Flora';
import { PhotoStrip } from './Photos';
import { StopText } from './StopText';
import { T, tap } from './ui';

/** One stop as a page: number, title, actions, photos and the book's text (or a teaser if locked). */
export function StopSection({ stop, index, locked, walkColor, onMap, width }: { stop: Stop; index: number; locked: boolean; walkColor: string; onMap: () => void; width: number }) {
  const t = useTheme();
  const fav = useProgress((s) => s.favorites.includes(stop.id));
  const toggleFav = useProgress((s) => s.toggleFavorite);
  const speaking = useNarration((s) => s.speakingStopId === stop.id);
  return (
    <View style={{ gap: 12 }}>
      <View accessible accessibilityRole="header" accessibilityLabel={`Stop ${stop.n}, ${stop.title}${stop.subtitle ? `. ${stop.subtitle}` : ''}${locked ? '. Locked' : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.num, { backgroundColor: locked ? t.lockedFill : walkColor }]}>
          <T style={{ color: locked ? '#FFFFFF' : readableOn(walkColor), fontFamily: t.font.bodyBold }}>{stop.n}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T variant="title" style={{ fontSize: 22, lineHeight: 27 }}>
            {stop.title}
          </T>
          {stop.subtitle ? (
            <T variant="italic" style={{ color: t.textMuted }}>
              {stop.subtitle}
            </T>
          ) : null}
        </View>
      </View>
      <WaveRule width={70} color={walkColor} />
      {locked ? (
        <LockedTeaser stop={stop} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable hitSlop={{ top: 2, bottom: 2 }} accessibilityRole="button" accessibilityLabel={speaking ? 'Stop reading' : 'Listen to this stop'} onPress={() => { tap(); speaking ? stopSpeech() : play(stop); }} style={[styles.action, { backgroundColor: t.cardAlt }]}>
              <Ionicons name={speaking ? 'stop-circle' : 'volume-high'} size={18} color={t.primary} />
              <T style={{ fontFamily: t.font.bodySemi, fontSize: 14 }}>{speaking ? 'Stop' : 'Listen'}</T>
            </Pressable>
            <Pressable hitSlop={{ top: 2, bottom: 2 }} accessibilityRole="button" accessibilityLabel="Show this stop on the map" onPress={() => { tap(); onMap(); }} style={[styles.action, { backgroundColor: t.cardAlt }]}>
              <Ionicons name="map" size={18} color={t.primary} />
              <T style={{ fontFamily: t.font.bodySemi, fontSize: 14 }}>On map</T>
            </Pressable>
            <Pressable hitSlop={{ top: 2, bottom: 2 }} accessibilityRole="button" accessibilityLabel={fav ? 'Remove from saved' : 'Save stop'} accessibilityState={{ selected: fav }} onPress={() => { tap(); toggleFav(stop.id); }} style={[styles.action, { backgroundColor: t.cardAlt }]}>
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={t.accent} />
            </Pressable>
          </View>
          <PhotoStrip photos={stop.photos} height={width > 400 ? 200 : 170} />
          <StopText blocks={stop.blocks} stopId={stop.id} />
        </>
      )}
    </View>
  );
}

/**
 * A locked stop still shows its first photo and opening lines, fading out, so walkers can
 * see what they are missing. One tap opens the purchase sheet.
 */
export function LockedTeaser({ stop }: { stop: Stop }) {
  const t = useTheme();
  const first = stop.photos[0];
  const teaser = (stop.blocks.find((b) => b.kind === 'p')?.text ?? '').split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  return (
    <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button" accessibilityLabel={`Unlock ${stop.title}`} style={{ gap: 10 }}>
      {first ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Image accessibilityIgnoresInvertColors source={photo(first.file)} style={{ height: 170, flex: 2, borderRadius: 16 }} contentFit="cover" />
          {stop.photos.length > 1 ? (
            <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: t.cardAlt }}>
              <Image accessibilityIgnoresInvertColors source={photo(stop.photos[1].file)} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={22} />
              <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                <Ionicons name="lock-closed" size={22} color="#fff" />
                <T style={{ color: '#fff', fontFamily: t.font.bodyBold, fontSize: 13 }}>+{stop.photos.length - 1} photos</T>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      {teaser ? (
        <View>
          <T>{teaser}</T>
          <LinearGradient colors={['transparent', t.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }} />
        </View>
      ) : null}
      <View style={[styles.lock, { backgroundColor: t.accent, borderColor: t.accent }]}>
        <Ionicons name="lock-open" size={20} color={t.accentText} />
        <View style={{ flex: 1 }}>
          <T style={{ color: t.accentText, fontFamily: t.font.bodyBold }}>Keep reading with Veneeta</T>
          <T style={{ color: t.accentTextMuted, fontSize: 13 }}>Unlock every walk, stop, and photo</T>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.accentText} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  // 44 pt tall, Apple's default control size; the 2 pt vertical hitSlop gives Android's 48 dp touch target.
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22 },
});
