import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Hibiscus, WaveRule } from '../components/Flora';
import { Card, T } from '../components/ui';
import about from '../data/about.json';
import { APP_COPYRIGHT } from '../legal';
import { useTheme } from '../theme';

/**
 * The book's front matter: dedications, foreword, introduction, the Hawaiian language
 * and pronunciation guide, the Monarchy table and dates, and Wahi Pana. All text comes
 * from scripts/build_data.py, which reads it from the book.
 */
type AboutBlock =
  | { k: 'p' | 'h' | 'li' | 'lead'; t: string }
  | { k: 'date'; d: string; t: string }
  | { k: 'royal'; name: string; alt: string; lived: string; ruled: string; consorts: string };
type AboutSection = { title: string; id?: string; blocks: AboutBlock[] };

export default function About() {
  const t = useTheme();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const sections = about as AboutSection[];
  const scroll = useRef<ScrollViewInstance>(null);
  const [tops, setTops] = useState<Record<number, number>>({});
  const jumped = useRef(false);

  const jump = (i: number) => {
    const y = tops[i];
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };

  // Opened from a link such as "How to say Hawaiian words": go straight to that section.
  useEffect(() => {
    if (!section || jumped.current) return;
    const i = sections.findIndex((s) => s.id === section);
    if (i >= 0 && tops[i] !== undefined) {
      jumped.current = true;
      scroll.current?.scrollTo({ y: Math.max(0, tops[i] - 12), animated: false });
    }
  }, [section, tops, sections]);

  return (
    <ScrollView ref={scroll} style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Hibiscus size={64} color={t.accent} />
        <T variant="display" style={{ textAlign: 'center' }}>
          Waikīkī
        </T>
        <T style={{ fontFamily: t.font.display, letterSpacing: 2 }}>TWELVE WALKS THROUGH TIME</T>
        <T variant="italic">Veneeta Acson, Ph.D.</T>
        <WaveRule width={120} color={t.primary} />
      </View>

      <Card style={{ gap: 2 }}>
        <T variant="label" style={{ marginBottom: 4 }}>
          IN THIS SECTION
        </T>
        {sections.map((s, i) => (
          <Pressable
            key={s.title}
            onPress={() => jump(i)}
            accessibilityRole="link"
            accessibilityLabel={`Go to ${s.title}`}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, opacity: pressed ? 0.6 : 1 })}
          >
            <T style={{ flex: 1, color: t.primary, fontFamily: t.font.bodySemi }}>{s.title}</T>
            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
          </Pressable>
        ))}
      </Card>

      {sections.map((s, i) => (
        <View key={s.title} onLayout={(e) => { const y = e.nativeEvent.layout.y; setTops((o) => (o[i] === y ? o : { ...o, [i]: y })); }}>
          <Card style={{ gap: 10 }}>
            <View accessibilityRole="header">
              <T variant="title" style={{ fontSize: 21 }}>
                {s.title}
              </T>
            </View>
            {s.blocks.map((b, j) => (
              <AboutBlockView key={j} b={b} />
            ))}
          </Card>
        </View>
      ))}
      <T variant="small" style={{ textAlign: 'center' }}>
        {APP_COPYRIGHT}
        {'\n'}Book text and photographs © 2023 Island Heritage. All rights reserved.
      </T>
    </ScrollView>
  );
}

function AboutBlockView({ b }: { b: AboutBlock }) {
  const t = useTheme();
  switch (b.k) {
    case 'lead':
      return <T variant="italic">{b.t}</T>;
    case 'h':
      return (
        <View accessibilityRole="header" style={{ marginTop: 6 }}>
          <T style={{ fontFamily: t.font.bodySemi, color: t.primary, fontSize: 17 }}>{b.t}</T>
        </View>
      );
    case 'li':
      return (
        <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
          <T style={{ color: t.accent }}>{'•'}</T>
          <T style={{ flex: 1 }}>{b.t}</T>
        </View>
      );
    case 'date':
      return (
        <T>
          <T style={{ fontFamily: t.font.bodySemi }}>{b.d}</T> {b.t}
        </T>
      );
    case 'royal':
      return (
        <View
          accessible
          accessibilityLabel={`${b.name}${b.alt ? `, ${b.alt}` : ''}. Lived ${b.lived}.${b.ruled ? ` Ruled ${b.ruled}.` : ''} Consorts: ${b.consorts}.`}
          style={{ borderTopWidth: 1, borderColor: t.border, paddingTop: 8, gap: 2 }}
        >
          <T style={{ fontFamily: t.font.bodySemi, color: t.primary }}>
            {b.name}
            {b.alt ? <T variant="small"> ({b.alt})</T> : null}
          </T>
          <T variant="small">
            Lived {b.lived}
            {b.ruled ? `  ·  Ruled ${b.ruled}` : ''}
          </T>
          <T variant="small">Consorts: {b.consorts}</T>
        </View>
      );
    default:
      return <T>{b.t}</T>;
  }
}
