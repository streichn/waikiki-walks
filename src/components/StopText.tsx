import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { lookupWord } from '../data';
import type { Block, GlossaryEntry } from '../data/types';
import { speakShort, useNarration } from '../lib/narration';
import { useSettings } from '../store';
import { useTheme } from '../theme';
import { Button, T } from './ui';

/**
 * Renders a stop's text from the book. Directions are styled as "walking" callouts,
 * the paragraph being read aloud is highlighted, and Hawaiian words that appear in the
 * book's glossary are tappable for their meaning.
 */
export function StopText({ blocks, stopId }: { blocks: Block[]; stopId: string }) {
  const t = useTheme();
  const scale = useSettings((s) => s.textScale);
  const speaking = useNarration((s) => (s.speakingStopId === stopId ? s.paragraph : -2));
  const [word, setWord] = useState<GlossaryEntry | null>(null);
  const firsts = useMemo(() => firstGlossaryHits(blocks), [blocks]);
  let readable = -1;

  return (
    <View style={{ gap: 14 }}>
      {blocks.map((b, i) => {
        if (b.kind === 'p' || b.kind === 'direction' || b.kind === 'tagline') readable += 1;
        const active = (b.kind === 'p' || b.kind === 'direction' || b.kind === 'tagline') && readable === speaking;
        if (b.kind === 'direction') {
          return (
            <View key={i} style={[styles.direction, { backgroundColor: t.dark ? '#103A3E' : '#E3F3F1', borderColor: active ? t.gold : 'transparent' }]}>
              <Ionicons name="walk" size={20} color={t.primary} style={{ marginTop: 2 }} />
              <Rich text={b.text} hits={firsts[i]} onWord={setWord} style={{ flex: 1, fontFamily: t.font.bodySemi, fontSize: 16 * scale, lineHeight: 23 * scale, color: t.text }} />
            </View>
          );
        }
        if (b.kind === 'info') {
          return (
            <View key={i} style={[styles.info, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
              <Ionicons name="information-circle" size={18} color={t.gold} />
              <T variant="small" style={{ flex: 1, color: t.text }}>
                {b.text}
              </T>
            </View>
          );
        }
        if (b.kind === 'caption') {
          return (
            <T key={i} variant="small" style={{ fontStyle: 'italic' }}>
              {b.text}
            </T>
          );
        }
        if (b.kind === 'tagline' || b.kind === 'heading') {
          return (
            <T key={i} variant="italic" style={{ color: t.leaf, fontSize: 18 }}>
              {b.text}
            </T>
          );
        }
        return (
          <View key={i} style={[active && { backgroundColor: t.dark ? '#3A2A10' : '#FFF0D6', borderRadius: 10, marginHorizontal: -8, paddingHorizontal: 8 }]}>
            <Rich text={b.text} hits={firsts[i]} onWord={setWord} style={{ fontFamily: t.font.body, fontSize: 17 * scale, lineHeight: 27 * scale, color: t.text }} />
          </View>
        );
      })}
      <Modal visible={!!word} transparent animationType="fade" onRequestClose={() => setWord(null)}>
        <Pressable style={styles.backdrop} onPress={() => setWord(null)}>
          <View style={[styles.wordCard, { backgroundColor: t.card }]}>
            <T variant="title">{word?.word}</T>
            <T style={{ marginTop: 8 }}>{word?.meaning}</T>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button kind="outline" icon="volume-high" label="Hear it" onPress={() => word && speakShort(word.word)} style={{ flex: 1 }} />
              <Button label="Mahalo" onPress={() => setWord(null)} style={{ flex: 1 }} />
            </View>
            <T variant="small" style={{ marginTop: 10 }}>
              From the book's Hawaiian glossary.
            </T>
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
              <Text key={i} onPress={() => onWord(g)} style={{ color: t.primary, textDecorationLine: 'underline', textDecorationStyle: 'dotted' }}>
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
  direction: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, borderWidth: 2 },
  info: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 28 },
  wordCard: { borderRadius: 22, padding: 22 },
});
