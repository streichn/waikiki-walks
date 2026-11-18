import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { photo, walkNo } from '../data';
import type { Walk } from '../data/types';
import { bookLabel, bookPages, bookXY, pageFor } from '../lib/bookmap';
import { useTheme } from '../theme';
import { T, tap } from './ui';

/**
 * Apple Maps-style controls.
 * Locate button cycles: off → follow me (blue dot centered) → follow with heading (map turns as you turn).
 * Layers button: street map, satellite, satellite with street names, or the book's own map.
 */

export type FollowMode = 'off' | 'follow' | 'heading';
export type Layer = 'standard' | 'satellite' | 'hybrid';

export function nextFollow(m: FollowMode): FollowMode {
  return m === 'off' ? 'follow' : m === 'follow' ? 'heading' : 'off';
}

export function LocateButton({ mode, onPress, disabled }: { mode: FollowMode; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  const icon = mode === 'heading' ? 'compass' : mode === 'follow' ? 'navigate' : 'navigate-outline';
  return (
    <Pressable
      accessibilityLabel={mode === 'off' ? 'Center on my location' : mode === 'follow' ? 'Follow my direction' : 'Stop following'}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.btn, { backgroundColor: t.card, borderColor: t.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <Ionicons name={icon} size={22} color={mode === 'off' ? t.text : '#1A73E8'} />
    </Pressable>
  );
}

export function LayersButton({ layer, onChange, bookMap, bookActive, onBook }: { layer: Layer; onChange: (l: Layer) => void; bookMap?: string; bookActive?: boolean; onBook?: () => void }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const opts: { key: Layer | 'book'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'standard', label: 'Street map', icon: 'map-outline' },
    { key: 'satellite', label: 'Satellite', icon: 'earth' },
    { key: 'hybrid', label: 'Satellite with streets', icon: 'layers' },
    ...(bookMap ? [{ key: 'book' as const, label: "Veneeta's map from the book", icon: 'book' as const }] : []),
  ];
  return (
    <>
      <Pressable accessibilityLabel="Map style" onPress={() => { tap(); setOpen(true); }} style={[styles.btn, { backgroundColor: t.card, borderColor: t.border }]}>
        <Ionicons name="layers-outline" size={22} color={t.text} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: t.card }]}>
            <T variant="label">Map style</T>
            {opts.map((o) => {
              const on = o.key === 'book' ? !!bookActive : !bookActive && o.key === layer;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    tap();
                    setOpen(false);
                    if (o.key === 'book') (onBook ? onBook() : setShowBook(true));
                    else onChange(o.key);
                  }}
                  style={[styles.row, { borderColor: on ? t.accent : t.border }]}
                >
                  <Ionicons name={o.icon} size={20} color={on ? t.accent : t.primary} />
                  <T style={{ flex: 1 }}>{o.label}</T>
                  {on ? <Ionicons name="checkmark" size={20} color={t.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
      {bookMap ? <BookMapViewer file={bookMap} visible={showBook} onClose={() => setShowBook(false)} /> : null}
    </>
  );
}

/** Street map or Veneeta's own map from the book, as the main map view. */
export function MapStyleSwitch({ book, onChange }: { book: boolean; onChange: (book: boolean) => void }) {
  const t = useTheme();
  const opt = (label: string, value: boolean, icon?: keyof typeof Ionicons.glyphMap) => {
    const on = book === value;
    return (
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { tap(); onChange(value); }} style={[styles.styleBtn, on && { backgroundColor: t.primary }]}>
        {icon ? <Ionicons name={icon} size={14} color={on ? t.primaryText : t.textMuted} /> : null}
        <T style={{ fontFamily: t.font.bodyBold, fontSize: 13, color: on ? t.primaryText : t.textMuted }}>{label}</T>
      </Pressable>
    );
  };
  return (
    <View style={[styles.styleSwitch, { backgroundColor: t.card }]} accessibilityRole="tablist">
      {opt('Street map', false)}
      {opt('Book map', true, 'book')}
    </View>
  );
}

/**
 * Veneeta's walk map filling the map area, with the stops and the walker's position drawn on it.
 * Pinch to zoom on iPhone; drag to pan.
 */
export function BookMapPane({ walk, current, visited, isLocked, me, onSelect, topInset = 0, bottomInset = 0 }: {
  walk: Walk; current?: number; visited?: number[]; isLocked?: (i: number) => boolean; me?: { lat: number; lng: number } | null;
  onSelect?: (i: number) => void; topInset?: number; bottomInset?: number;
}) {
  const t = useTheme();
  const { width, height: screenH } = useWindowDimensions();
  const height = width / 0.7;
  // Open the page that prints the current stop; the page buttons switch until the stop changes.
  const pages = bookPages(walk.id);
  const curN = current !== undefined && current >= 0 ? walk.stops[current]?.n : undefined;
  const [page, setPage] = useState(() => pageFor(walk.id, curN));
  useEffect(() => setPage(pageFor(walk.id, curN)), [walk.id, curN]);
  const file = page === 0 ? walk.bookMap : pages[page]?.file;
  const dot = me ? bookXY(walk.id, me.lat, me.lng, page) : null;
  const scroll = useRef<ScrollViewInstance>(null);
  const [follow, setFollow] = useState(true);
  // Keep the walker's dot in the middle of the visible map, like follow mode on a street map.
  const centerOnMe = () => {
    if (!dot) return;
    const visible = screenH - topInset - bottomInset;
    scroll.current?.scrollTo({ y: Math.max(0, dot.y * height - visible / 2), animated: true });
  };
  useEffect(() => {
    if (follow) centerOnMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dot?.x, dot?.y, follow]);
  return (
    <View style={{ flex: 1 }}>
    <ScrollView ref={scroll} onScrollBeginDrag={() => setFollow(false)} style={{ flex: 1, backgroundColor: t.dark ? t.bg : '#FBF6EC' }} maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }} showsVerticalScrollIndicator={false}>
      <View style={{ width, height }}>
        <Image accessibilityIgnoresInvertColors source={photo(file)} style={{ width, height }} contentFit="contain" accessibilityLabel={`Walk ${walkNo(walk.id)} map ${page + 1} from the book`} />
        {walk.stops.map((s, i) => {
          // Her printed number is the pin; this is just an invisible tap target over it (ringed when current).
          const L = bookLabel(walk.id, s.n, page);
          if (!L) return null;
          return (
            <Pressable key={s.id} accessibilityLabel={`Stop ${s.n}, ${s.title}`} onPress={() => onSelect?.(i)}
              style={[styles.bhit, { left: L.x * width - 18, top: L.y * height - 18 }]} />
          );
        })}
        {dot ? (
          // Sized like her own map markers (it zooms with the map), translucent with a soft glow so her streets show through.
          <View pointerEvents="none" style={[styles.me, { left: dot.x * width - (width * 0.028) / 2, top: dot.y * height - (width * 0.028) / 2, width: width * 0.028, height: width * 0.028, borderRadius: width * 0.014 }]} />
        ) : null}
      </View>
    </ScrollView>
    {pages.length > 1 ? (
      <View style={[styles.pageTabs, { top: topInset + 8 }]} accessibilityRole="tablist">
        {pages.map((_, j) => (
          <Pressable key={j} accessibilityRole="tab" accessibilityState={{ selected: j === page }} onPress={() => { tap(); setPage(j); }}
            style={[styles.pageTab, j === page && styles.pageTabOn]}>
            <Text style={[styles.pageTabText, j === page && { color: '#fff' }]}>Map {j + 1}</Text>
          </Pressable>
        ))}
      </View>
    ) : null}
    {dot ? (
      <Pressable accessibilityLabel="Go to my position" onPress={() => { tap(); setFollow(true); centerOnMe(); }} style={[styles.btn, styles.meBtn, { top: topInset + 46 }]}>
        <Ionicons name={follow ? 'navigate' : 'navigate-outline'} size={22} color="#1A73E8" />
      </Pressable>
    ) : null}
    </View>
  );
}

/** The walk's map page from the book, pinch to zoom. */
export function BookMapViewer({ file, visible, onClose }: { file: string; visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* In dark mode the page sits on the dark background so the screen does not flash bright (Apple, Dark Interface criteria). */}
      <View style={{ flex: 1, backgroundColor: t.dark ? t.bg : '#FBF6EC' }}>
        <ScrollView maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} centerContent showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
          <Image accessibilityIgnoresInvertColors source={photo(file)} style={{ width, height: height * 0.9 }} contentFit="contain" />
        </ScrollView>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={[styles.close, { top: insets.top + 10 }]}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <T variant="small" style={{ position: 'absolute', bottom: insets.bottom + 12, alignSelf: 'center', color: t.textMuted }}>
          Map from the book. Pinch to zoom.
        </T>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pageTabs: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.95)', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  pageTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pageTabOn: { backgroundColor: '#0E6E74' },
  pageTabText: { fontWeight: '700', color: '#1F2A2B' },
  btn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { margin: 12, borderRadius: 22, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  bhit: { position: 'absolute', width: 36, height: 36, borderRadius: 18 },
  bpin: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 },
  meBtn: { position: 'absolute', left: 14, backgroundColor: '#fff', borderColor: '#ddd' },
  me: { position: 'absolute', backgroundColor: 'rgba(26,115,232,0.5)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#1A73E8', shadowOpacity: 0.5, shadowRadius: 8, elevation: 4, zIndex: 3 },
  styleSwitch: { flexDirection: 'row', padding: 3, gap: 3, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  styleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 11 },
  close: { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
