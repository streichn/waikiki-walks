import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useOnline } from '../lib/network';
import { useTheme } from '../theme';
import { T } from './ui';

/**
 * A small, calm notice on the walk screen when the phone has no internet.
 * Losing signal should not feel like the walk broke: the text, photos, pins, GPS, and
 * arrival alerts all live on the phone. Only the street map underneath may go blank.
 * Tap to expand or collapse. Screen readers hear the change once.
 */
export function OfflineNote({ style, hasBookMap }: { style?: ViewStyle; hasBookMap?: boolean }) {
  const t = useTheme();
  const online = useOnline();
  const [open, setOpen] = useState(true);
  const was = useRef(online);

  useEffect(() => {
    if (was.current !== online) {
      AccessibilityInfo.announceForAccessibility(online ? 'Back online.' : 'No internet. Your walk still works.');
      if (!online) setOpen(true);
    }
    was.current = online;
  }, [online]);

  if (online) return null;
  const detail = `The text, photos, pins, GPS, and arrival alerts work without signal. The street map may not load in places you haven't viewed.${hasBookMap ? " The book's walk map in the layers menu always works." : ''}`;
  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      accessibilityRole="button"
      accessibilityLabel={`No internet. Your walk still works. ${open ? detail : ''}`}
      accessibilityHint={open ? 'Collapses this notice' : 'Shows what works offline'}
      style={[styles.box, { backgroundColor: t.card, borderColor: t.border }, style]}
    >
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={18} color={t.textMuted} />
        <T style={{ fontFamily: t.font.bodyBold, fontSize: 14, flex: 1 }}>No internet. Your walk still works.</T>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
      </View>
      {open ? <T variant="small" style={{ marginTop: 4 }}>{detail}</T> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
