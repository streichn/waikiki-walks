import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Hibiscus, WaveRule } from '../components/Flora';
import { Card, T } from '../components/ui';
import { APP_COPYRIGHT, AUTHOR, CREDITS, DEDICATION, LINKS } from '../legal';
import { useTheme } from '../theme';

export default function Credits() {
  const t = useTheme();
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Hibiscus size={56} color={t.accent} />
        <T variant="title">Waikīkī Walks</T>
        <T variant="italic">by {AUTHOR}</T>
        <T variant="italic" style={{ color: t.leaf }}>
          {DEDICATION}
        </T>
        <WaveRule width={110} color={t.primary} />
      </View>
      {CREDITS.map((c) => (
        <Card key={c.title} style={{ gap: 6 }}>
          <T variant="label">{c.title}</T>
          {c.lines.map((l) => (
            <T key={l} style={{ fontSize: 15, lineHeight: 22 }}>
              {l}
            </T>
          ))}
        </Card>
      ))}
      <Card style={{ gap: 10 }}>
        <T variant="label">Legal</T>
        <Pressable onPress={() => Linking.openURL(LINKS.privacy)}>
          <T style={{ color: t.primary }}>Privacy policy</T>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(LINKS.terms)}>
          <T style={{ color: t.primary }}>Terms of use</T>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(LINKS.appleEula)}>
          <T style={{ color: t.primary }}>Apple standard license agreement</T>
        </Pressable>
      </Card>
      <T variant="small" style={{ textAlign: 'center' }}>
        {APP_COPYRIGHT}
      </T>
    </ScrollView>
  );
}
