import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

/** Hand-drawn style hibiscus. */
export function Hibiscus({ size = 64, color = '#D6336C', center = '#F29E4C', opacity = 1, rotate = 0 }: { size?: number; color?: string; center?: string; opacity?: number; rotate?: number }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <G>
        {petals.map((a) => (
          <Path
            key={a}
            d="M50 50 C 36 34, 30 12, 50 6 C 70 12, 64 34, 50 50 Z"
            fill={color}
            opacity={0.92}
            transform={`rotate(${a} 50 50)`}
          />
        ))}
        {petals.map((a) => (
          <Path key={`v${a}`} d="M50 48 L50 14" stroke="#00000022" strokeWidth={1.2} transform={`rotate(${a} 50 50)`} />
        ))}
        <Circle cx={50} cy={50} r={7} fill="#7A1636" />
        <Path d="M50 50 L66 30" stroke={center} strokeWidth={2.6} strokeLinecap="round" />
        <Circle cx={67} cy={28} r={3.2} fill={center} />
        <Circle cx={63} cy={26} r={2} fill={center} />
        <Circle cx={70} cy={32} r={2} fill={center} />
      </G>
    </Svg>
  );
}

/** Plumeria (frangipani), five overlapping cream petals with a yellow heart. */
export function Plumeria({ size = 48, opacity = 1, rotate = 0 }: { size?: number; opacity?: number; rotate?: number }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      {petals.map((a) => (
        <Ellipse key={a} cx={50} cy={27} rx={15} ry={24} fill="#FFFDF7" stroke="#EADBC0" strokeWidth={1} transform={`rotate(${a} 50 50) rotate(18 50 27)`} />
      ))}
      <Circle cx={50} cy={50} r={11} fill="#FFD25E" />
      <Circle cx={50} cy={50} r={5} fill="#F7B733" />
    </Svg>
  );
}

/** Monstera leaf silhouette for corners and headers. */
export function Monstera({ size = 120, color = '#3A7D44', opacity = 0.18, rotate = 0 }: { size?: number; color?: string; opacity?: number; rotate?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Path
        fill={color}
        d="M50 96 C 49 80, 48 70, 46 60 C 30 66, 12 62, 6 48 C 16 48, 22 46, 26 42 C 14 40, 6 30, 8 18 C 18 24, 26 26, 32 26 C 26 18, 26 8, 34 2 C 38 12, 42 18, 48 22 C 52 14, 58 6, 68 4 C 66 14, 62 20, 58 26 C 66 24, 76 18, 88 20 C 86 30, 78 38, 66 40 C 74 44, 84 46, 94 44 C 90 58, 76 64, 58 60 C 56 70, 54 80, 54 96 Z"
      />
      <Path d="M50 94 C 50 70, 50 45, 49 20" stroke="#00000020" strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

/** Gentle wave rule used under headings. */
export function WaveRule({ width = 120, color = '#2BA8A4' }: { width?: number; color?: string }) {
  return (
    <Svg width={width} height={10} viewBox="0 0 120 10">
      <Path d="M0 5 Q 10 0 20 5 T 40 5 T 60 5 T 80 5 T 100 5 T 120 5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
