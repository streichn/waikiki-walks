import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { facts } from '../data';
import { useTheme } from '../theme';
import { Hibiscus } from './Flora';
import { T, tap } from './ui';

/** Rotating "Did you know?" card. Every fact is a sentence from the book. */
export function FunFacts({ walkId, interval = 9000 }: { walkId?: string; interval?: number }) {
  const t = useTheme();
  const pool = useMemo(() => {
    const own = walkId ? facts.filter((f) => f.walkId === walkId) : facts;
    const list = own.length ? own : facts;
    return [...list].sort(() => Math.random() - 0.5);
  }, [walkId]);
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const next = () => {
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setI((x) => (x + 1) % pool.length);
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    const id = setInterval(next, interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, interval]);

  if (!pool.length) return null;
  const f = pool[i];
  return (
    <Pressable
      accessibilityHint="Shows another fact"
      onPress={() => {
        tap();
        next();
      }}
      style={[styles.box, { backgroundColor: t.dark ? '#1C3A2C' : '#EAF5EC', borderColor: t.dark ? '#2F5C45' : '#CFE6D4' }]}
    >
      <View style={styles.flower}>
        <Hibiscus size={58} opacity={0.9} rotate={-12} color={t.accent} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Ionicons name="sparkles" size={14} color={t.leaf} />
        <T variant="label" style={{ color: t.leaf }}>
          Did you know?
        </T>
      </View>
      <Animated.View style={{ opacity: fade, paddingRight: 44 }}>
        <T variant="italic" style={{ fontSize: 16, lineHeight: 23 }}>
          {f.text}
        </T>
        {f.walkId ? (
          <T variant="small" style={{ marginTop: 6 }}>
            From Walk {f.walkId}
          </T>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 20, padding: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  flower: { position: 'absolute', right: -8, top: -8 },
});
