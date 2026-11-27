import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveWalkBar } from '../../components/ActiveWalkBar';
import { useSettings } from '../../store';
import { useTheme } from '../../theme';

export default function TabLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const onboarded = useSettings((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/welcome" />;
  const tabH = 58 + insets.bottom;
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: t.accent,
          tabBarInactiveTintColor: t.textMuted,
          tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border, height: tabH, paddingTop: 6 },
          tabBarLabelStyle: { fontFamily: t.font.bodySemi, fontSize: 11 },
          // Like iOS's own tab bars, the labels keep their size with large text; the screens grow.
          tabBarAllowFontScaling: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Walks', tabBarIcon: ({ color, size }) => <Ionicons name="flower" size={size} color={color as string} /> }} />
        <Tabs.Screen name="explore" options={{ title: 'Map', tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color as string} /> }} />
        <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color as string} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color as string} /> }} />
      </Tabs>
      <ActiveWalkBar bottom={tabH + 8} />
    </View>
  );
}
