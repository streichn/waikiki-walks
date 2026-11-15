import { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { useTheme } from '../theme';

/** Small dependency-free slider (avoids another native module). */
export default function Slider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const t = useTheme();
  const [w, setW] = useState(1);
  const width = useRef(1);
  const startX = useRef(0);
  const pct = (value - min) / (max - min);
  const toValue = (x: number) => {
    const raw = min + Math.max(0, Math.min(1, x / width.current)) * (max - min);
    return Math.round(raw / step) * step;
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        startX.current = e.nativeEvent.locationX;
        onChange(Number(toValue(startX.current).toFixed(2)));
      },
      onPanResponderMove: (_e, g) => onChange(Number(toValue(startX.current + g.dx).toFixed(2))),
    }),
  ).current;
  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => {
        width.current = e.nativeEvent.layout.width;
        setW(e.nativeEvent.layout.width);
      }}
      style={{ height: 36, justifyContent: 'center' }}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.min(max, Math.max(min, value + (e.nativeEvent.actionName === 'increment' ? step : -step))))}
    >
      <View style={{ height: 4, borderRadius: 2, backgroundColor: t.border }} />
      <View style={{ position: 'absolute', height: 4, borderRadius: 2, width: pct * w, backgroundColor: t.primary }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: pct * w - 12, width: 24, height: 24, borderRadius: 12, backgroundColor: t.card, borderWidth: 3, borderColor: t.primary }} />
    </View>
  );
}
