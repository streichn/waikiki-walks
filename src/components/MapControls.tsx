import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { photo } from '../data';
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

/** Veneeta's walk map filling the map area. Pinch to zoom on iPhone; drag to pan. */
export function BookMapPane({ file, topInset = 0, bottomInset = 0 }: { file: string; topInset?: number; bottomInset?: number }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FBF6EC' }} maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }} showsVerticalScrollIndicator={false}>
      <Image source={photo(file)} style={{ width, aspectRatio: 0.7 }} contentFit="contain" accessibilityLabel="Walk map from the book" />
    </ScrollView>
  );
}

/** The walk's map page from the book, pinch to zoom. */
export function BookMapViewer({ file, visible, onClose }: { file: string; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#FBF6EC' }}>
        <ScrollView maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} centerContent showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
          <Image source={photo(file)} style={{ width, height: height * 0.9 }} contentFit="contain" />
        </ScrollView>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={[styles.close, { top: insets.top + 10 }]}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <T variant="small" style={{ position: 'absolute', bottom: insets.bottom + 12, alignSelf: 'center', color: '#5E6B6B' }}>
          Map from the book. Pinch to zoom.
        </T>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { margin: 12, borderRadius: 22, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  styleSwitch: { flexDirection: 'row', padding: 3, gap: 3, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  styleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 11 },
  close: { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
