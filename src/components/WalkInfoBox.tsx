import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { InfoRow } from '../data/types';
import { useTheme } from '../theme';
import { T } from './ui';

const ICONS: Record<Exclude<InfoRow['kind'], 'heading'>, keyof typeof Ionicons.glyphMap> = {
  time: 'time-outline',
  route: 'flag-outline',
  bus: 'bus-outline',
  parking: 'car-outline',
  web: 'globe-outline',
  contact: 'call-outline',
  note: 'information-circle-outline',
};

// Web addresses and phone numbers as the book prints them: "www.thebus.org", "manoaheritagecenter.org",
// "808-848-5555", "(808) 988-1287".
const LINK = /(www\.[\w.-]+\.[a-z]{2,}|\b[\w-]+\.(?:org|com)\b|\(\d{3}\) ?\d{3}-\d{4}|\b\d{3}-\d{3}-\d{4}\b)/g;

function hrefFor(part: string) {
  if (/^[\d(]/.test(part)) return `tel:${part.replace(/[^\d]/g, '')}`;
  return `https://${part}`;
}

/** Text with the book's web addresses and phone numbers tappable (Apple: phone links use tel:). */
export function LinkedText({ text, color, linkColor, font }: { text: string; color: string; linkColor: string; font?: string }) {
  const parts = text.split(LINK);
  return (
    <Text style={[styles.text, { color, fontFamily: font }]}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Text
            key={i}
            accessibilityRole="link"
            accessibilityHint={p.startsWith('www') || /\.(org|com)$/.test(p) ? 'Opens in your browser' : 'Calls this number'}
            onPress={() => Linking.openURL(hrefFor(p)).catch(() => undefined)}
            style={{ color: linkColor, textDecorationLine: 'underline' }}
          >
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

/**
 * The walk's information box from the book (time and distance, buses, parking, websites), one row per
 * printed paragraph with the book's own labels, so it reads like the shaded panel on the walk's first page.
 */
export function WalkInfoBox({ rows }: { rows: InfoRow[] }) {
  const t = useTheme();
  if (!rows.length) return null;
  return (
    <View style={[styles.box, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
      <T variant="label" style={{ color: t.textMuted }}>Before you go</T>
      {rows.map((r, i) =>
        r.kind === 'heading' ? (
          <Text key={i} accessibilityRole="header" style={[styles.text, { fontFamily: t.font.bodyBold, color: t.text, marginTop: 4 }]}>
            {r.text}
          </Text>
        ) : (
          <View key={i} style={styles.row}>
            <Ionicons name={ICONS[r.kind]} size={18} color={t.gold} style={{ marginTop: 2 }} accessibilityElementsHidden importantForAccessibility="no" />
            <View style={{ flex: 1 }}>
              {r.label ? <Text style={[styles.text, { color: t.text, fontFamily: t.font.bodyBold }]}>{r.label}</Text> : null}
              <LinkedText text={r.text} color={t.text} linkColor={t.primary} font={t.font.body} />
            </View>
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  text: { fontSize: 15, lineHeight: 21 },
});
