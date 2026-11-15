import { ScrollView, View } from 'react-native';
import { Hibiscus, WaveRule } from '../components/Flora';
import { Card, T } from '../components/ui';
import about from '../data/about.json';
import { APP_COPYRIGHT } from '../legal';
import { useTheme } from '../theme';

export default function About() {
  const t = useTheme();
  const sections = about as { title: string; paragraphs: string[] }[];
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Hibiscus size={64} color={t.accent} />
        <T variant="display" style={{ textAlign: 'center' }}>
          Waikīkī
        </T>
        <T style={{ fontFamily: t.font.display, letterSpacing: 2 }}>TWELVE WALKS THROUGH TIME</T>
        <T variant="italic">Veneeta Acson, Ph.D.</T>
        <WaveRule width={120} color={t.primary} />
      </View>
      {sections.map((s) => (
        <Card key={s.title} style={{ gap: 10 }}>
          <T variant="title" style={{ fontSize: 21 }}>
            {s.title}
          </T>
          {s.paragraphs.map((p, i) => (
            <T key={i}>{p}</T>
          ))}
        </Card>
      ))}
      <T variant="small" style={{ textAlign: 'center' }}>
        {APP_COPYRIGHT}
        {'\n'}Book text and photographs © 2023 Island Heritage. All rights reserved.
      </T>
    </ScrollView>
  );
}
