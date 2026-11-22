import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Button, T } from './ui';

/**
 * Shown once, the first time a walk starts, just before the phone's own location prompt.
 *
 * Apple (HIG, Privacy > Pre-alert screens): one button only, titled "Continue" or "Next",
 * and no way to close the screen without seeing the system alert.
 * Google Play (User Data policy, prominent disclosure): say that location is used
 * "even when the app is closed or not in use", for which features, and show it before
 * the runtime prompt. The walk still works if the walker then says no (they tap Next).
 */
export function LocationPrimer({ visible, onContinue }: { visible: boolean; onContinue: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const rows: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'map', text: 'See where you are on the walk map and how far it is to the next stop.' },
    {
      icon: 'notifications',
      text: 'Get an alert when you reach a stop on the map, even when the app is closed or not in use, so your phone can stay in your pocket.',
    },
    { icon: 'lock-closed', text: 'Your location is used on this phone to follow the walk. We do not store it or share it.' },
    { icon: 'settings', text: 'You can change this any time in Settings. Without location, tap Next at each stop.' },
  ];
  if (Platform.OS === 'android') {
    rows.splice(2, 0, { icon: 'information-circle', text: 'For alerts with the app closed, choose “Allow all the time” when your phone asks.' });
  }
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onContinue}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, gap: 18 }}>
          <Ionicons name="navigate-circle" size={52} color={t.primary} accessibilityElementsHidden importantForAccessibility="no" />
          <View accessibilityRole="header">
            <T variant="title">Turn on location for this walk</T>
          </View>
          {rows.map((r) => (
            <View key={r.icon} style={styles.row}>
              <Ionicons name={r.icon} size={24} color={t.accent} accessibilityElementsHidden importantForAccessibility="no" />
              <T style={{ flex: 1, fontSize: 17, lineHeight: 24 }}>{r.text}</T>
            </View>
          ))}
        </ScrollView>
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          <Button label="Continue" onPress={onContinue} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
});
