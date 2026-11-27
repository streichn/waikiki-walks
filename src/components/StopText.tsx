import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { lookupWord } from '../data';
import type { Block, GlossaryEntry } from '../data/types';
import { speakShort, useNarration } from '../lib/narration';
import { useSettings } from '../store';
import { useTheme } from '../theme';
import { Button, T } from './ui';
import { LinkedText } from './WalkInfoBox';

/**
 * Renders a stop's text from the book. Directions are styled as "walking" callouts,
 * the paragraph being read aloud is highlighted, and Hawaiian words that appear in the
 * book's glossary are tappable for their meaning.
 */
export function StopText({ blocks, stopId }: { blocks: Block[]; stopId: string }) {
  const t = useTheme();
  const scale = useSettings((s) => s.textScale);
  const ls = useSettings((s) => s.lineSpacing ?? 1);
  const speaking = useNarration((s) => (s.speakingStopId === stopId ? s.paragraph : -2));
  const [word, setWord] = useState<GlossaryEntry | null>(null);
  const firsts = useMemo(() => firstGlossaryHits(blocks), [blocks]);
  const words = useMemo(() => glossaryWords(blocks), [blocks]);
  let readable = -1;

  const one = (b: Block, i: number) => {
        if (b.kind === 'p' || b.kind === 'direction' || b.kind === 'tagline') readable += 1;
        const active = (b.kind === 'p' || b.kind === 'direction' || b.kind === 'tagline') && readable === speaking;
        if (b.kind === 'direction') {
          return (
            <View key={i} accessible accessibilityLabel={`Walking direction. ${b.text}`} style={[styles.direction, { backgroundColor: t.dark ? '#103A3E' : '#E3F3F1', borderColor: active ? t.gold : 'transparent' }]}>
              <Ionicons name="walk" size={20} color={t.primary} style={{ marginTop: 2 }} />
              <Rich text={b.text} hits={firsts[i]} onWord={setWord} style={{ flex: 1, fontFamily: t.font.bodySemi, fontSize: 16 * scale, lineHeight: 23 * scale * ls, color: t.text }} />
            </View>
          );
        }
        if (b.kind === 'info') {
          return (
            <View key={i} accessible style={[styles.info, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
              <Ionicons name="information-circle" size={18} color={t.goldInk} />
              <View style={{ flex: 1 }}>
                <LinkedText text={b.text} color={t.text} linkColor={t.primary} font={t.font.body} />
              </View>
            </View>
          );
        }
        if (b.kind === 'caption') {
          return (
            <T key={i} variant="small" style={{ fontStyle: 'italic', fontSize: 14 * scale, lineHeight: 19 * scale * ls }}>
              {b.text}
            </T>
          );
        }
        if (b.kind === 'tagline' || b.kind === 'heading') {
          return (
            <T key={i} variant="italic" header style={{ color: t.leaf, fontSize: 18 * scale, lineHeight: 25 * scale * ls }}>
              {b.text}
            </T>
          );
        }
        return (
          <View key={i} style={[active && { backgroundColor: t.dark ? '#3A2A10' : '#FFF0D6', borderRadius: 10, borderLeftWidth: 4, borderLeftColor: t.gold, marginHorizontal: -8, paddingHorizontal: 8 }]}>
            <Rich text={b.text} hits={firsts[i]} onWord={setWord} style={{ fontFamily: t.font.body, fontSize: 17 * scale, lineHeight: 27 * scale * ls, color: t.text }} />
          </View>
        );
  };

  // Side trips from the book (its purple-line detours) sit in one highlighted box beside the main walk.
  const items: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].box && !blocks[i].aside) {
      // A plaque, sign or quotation the book prints in a shaded box: framed, between paragraphs, never inside one.
      const start = i;
      const inner: React.ReactNode[] = [];
      while (i < blocks.length && blocks[i].box) {
        const b = blocks[i];
        if (i === start && b.text.length < 90 && b.text.trim().endsWith(':')) {
          readable += 1;
          inner.push(
            <Text key={i} accessibilityRole="header" style={{ fontFamily: t.font.bodySemi, fontSize: 16 * scale, lineHeight: 23 * scale * ls, color: t.leaf, textAlign: 'center' }}>
              {b.text}
            </Text>,
          );
        } else {
          inner.push(one(b, i));
        }
        i++;
      }
      i--;
      items.push(
        <View key={`box-${start}`} style={[styles.box, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
          {inner}
        </View>,
      );
      continue;
    }
    if (!blocks[i].aside) {
      items.push(one(blocks[i], i));
      continue;
    }
    const start = i;
    const inner: React.ReactNode[] = [];
    while (i < blocks.length && blocks[i].aside) {
      inner.push(one(blocks[i], i));
      i++;
    }
    i--;
    items.push(
      <View key={`aside-${start}`} style={[styles.aside, { backgroundColor: t.dark ? '#2B2238' : '#F4EEFA', borderColor: t.dark ? '#6E5A8C' : '#B9A3D6' }]}>
        <View accessible accessibilityRole="header" accessibilityLabel="Side trip" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="git-branch-outline" size={16} color={t.dark ? '#C9B6E6' : '#6A4C93'} />
          <T variant="small" style={{ color: t.dark ? '#C9B6E6' : '#6A4C93', fontFamily: t.font.bodySemi, letterSpacing: 0.5 }}>
            SIDE TRIP
          </T>
        </View>
        {inner}
      </View>,
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {items}
      {words.length ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          <T variant="label" header>
            Hawaiian words on this stop
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {words.map((g) => (
              <Pressable
                key={g.word}
                accessibilityRole="button"
                accessibilityHint="Shows its meaning from the book's glossary"
                onPress={() => setWord(g)}
                style={({ pressed }) => [styles.wordChip, { backgroundColor: t.cardAlt, borderColor: t.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={{ fontFamily: t.font.bodySemi, fontSize: 15 * scale, color: t.primary }}>{g.word}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <Modal visible={!!word} transparent animationType="fade" onRequestClose={() => setWord(null)}>
        <Pressable style={styles.backdrop} onPress={() => setWord(null)} accessible={false}>
          <View style={[styles.wordCard, { backgroundColor: t.card }]} accessibilityViewIsModal>
            <T variant="title" header>{word?.word}</T>
            <T style={{ marginTop: 8 }}>{word?.meaning}</T>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button kind="outline" icon="volume-high" label="Hear it" onPress={() => word && speakShort(word.word)} style={{ flex: 1 }} />
              <Button label="Mahalo" onPress={() => setWord(null)} style={{ flex: 1 }} />
            </View>
            <T variant="small" style={{ marginTop: 10 }}>
              From the book's Hawaiian glossary.
            </T>
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                setWord(null);
                router.push({ pathname: '/about', params: { section: 'pronunciation' } });
              }}
              style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <T style={{ color: t.primary, fontFamily: t.font.bodySemi }}>How to say Hawaiian words</T>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const WORD = /([A-Za-zĀāĒēĪīŌōŪū‘ʻ’']+)/;

/** Underline a glossary word only the first time it appears on a stop, so the text stays easy to read. */
function firstGlossaryHits(blocks: Block[]): Set<number>[] {
  const seen = new Set<string>();
  return blocks.map((b) => {
    const hits = new Set<number>();
    if (b.kind !== 'p' && b.kind !== 'direction') return hits;
    b.text.split(WORD).forEach((p, i) => {
      if (i % 2 === 1 && p.length > 2) {
        const g = lookupWord(p);
        if (g && !seen.has(g.word)) {
          seen.add(g.word);
          hits.add(i);
        }
      }
    });
    return hits;
  });
}

/** The glossary words on a stop, in order, once each. A plain list of buttons is easier to reach with VoiceOver and TalkBack than words inside a paragraph. */
function glossaryWords(blocks: Block[]): GlossaryEntry[] {
  const seen = new Map<string, GlossaryEntry>();
  for (const b of blocks) {
    if (b.kind !== 'p' && b.kind !== 'direction') continue;
    b.text.split(WORD).forEach((p, i) => {
      if (i % 2 === 1 && p.length > 2) {
        const g = lookupWord(p);
        if (g && !seen.has(g.word)) seen.set(g.word, g);
      }
    });
  }
  return [...seen.values()];
}

function Rich({ text, style, hits, onWord }: { text: string; style: object; hits: Set<number>; onWord: (g: GlossaryEntry) => void }) {
  const t = useTheme();
  const parts = text.split(WORD);
  return (
    <Text style={style}>
      {parts.map((p, i) => {
        if (hits.has(i)) {
          const g = lookupWord(p);
          if (g)
            return (
              <Text key={i} onPress={() => onWord(g)} accessibilityRole="button" accessibilityHint="Shows its meaning from the book's glossary" style={{ color: t.primary, textDecorationLine: 'underline', textDecorationStyle: 'dotted' }}>
                {p}
              </Text>
            );
        }
        return p;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  aside: { borderLeftWidth: 4, borderRadius: 12, padding: 14, gap: 12 },
  box: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 },
  direction: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, borderWidth: 2 },
  info: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 28 },
  wordCard: { borderRadius: 22, padding: 22 },
  wordChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth },
});
