import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import { useSettings } from '../store';
import { useTheme } from '../theme';

export function tap() {
  if (useSettings.getState().haptics) Haptics.selectionAsync().catch(() => undefined);
}

export function T({ children, style, variant = 'body', numberOfLines, selectable, header }: { children: ReactNode; style?: TextStyle | TextStyle[]; variant?: 'display' | 'title' | 'h2' | 'body' | 'small' | 'label' | 'italic'; numberOfLines?: number; selectable?: boolean; header?: boolean }) {
  const t = useTheme();
  const scale = useSettings((s) => s.textScale);
  const base: Record<string, TextStyle> = {
    display: { fontFamily: t.font.display, fontSize: 34, lineHeight: 40, color: t.text },
    title: { fontFamily: t.font.display, fontSize: 26, lineHeight: 32, color: t.text },
    h2: { fontFamily: t.font.bodyBold, fontSize: 18, lineHeight: 24, color: t.text },
    body: { fontFamily: t.font.body, fontSize: 17 * scale, lineHeight: 26 * scale, color: t.text },
    small: { fontFamily: t.font.body, fontSize: 14, lineHeight: 19, color: t.textMuted },
    label: { fontFamily: t.font.bodyBold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: t.textMuted },
    italic: { fontFamily: t.font.displayItalic, fontSize: 17, lineHeight: 24, color: t.text },
  };
  return (
    <Text style={[base[variant], style as TextStyle]} numberOfLines={numberOfLines} selectable={selectable} accessibilityRole={header ? 'header' : undefined}>
      {children}
    </Text>
  );
}

export function Button({ label, onPress, icon, kind = 'primary', loading, style, disabled }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; kind?: 'primary' | 'accent' | 'ghost' | 'outline'; loading?: boolean; style?: ViewStyle; disabled?: boolean }) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.primary : kind === 'accent' ? t.accent : 'transparent';
  const fg = kind === 'primary' ? t.primaryText : kind === 'accent' ? t.accentText : t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: kind === 'outline' ? t.primary : 'transparent', opacity: pressed || disabled ? 0.75 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontFamily: t.font.bodyBold, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, size = 22, tint, style }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; size?: number; tint?: string; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      hitSlop={10}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.icon, { backgroundColor: t.card, borderColor: t.border, opacity: pressed ? 0.7 : 1 }, style]}
    >
      <Ionicons name={icon} size={size} color={tint ?? t.text} />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style as ViewStyle]}>{children}</View>;
}

export function Chip({ label, icon, color }: { label: string; icon?: keyof typeof Ionicons.glyphMap; color?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: t.cardAlt }]}>
      {icon ? <Ionicons name={icon} size={14} color={color ?? t.primary} /> : null}
      <Text style={{ color: t.text, fontFamily: t.font.bodySemi, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

export function Segmented<V extends string>({ value, options, onChange }: { value: V; options: { value: V; label: string; icon?: keyof typeof Ionicons.glyphMap }[]; onChange: (v: V) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segItem, on && { backgroundColor: t.card, shadowOpacity: 0.12 }]}
          >
            {o.icon ? <Ionicons name={o.icon} size={16} color={on ? t.primary : t.textMuted} /> : null}
            <Text style={{ fontFamily: t.font.bodyBold, fontSize: 14, color: on ? t.primary : t.textMuted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 28, borderWidth: 1.5 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, shadowColor: '#3b2a12', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  seg: { flexDirection: 'row', borderRadius: 22, padding: 3, borderWidth: StyleSheet.hairlineWidth },
  segItem: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 19, shadowColor: '#000', shadowOpacity: 0, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
});
