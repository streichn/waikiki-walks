import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { photo } from '../data';
import type { Photo } from '../data/types';
import { useTheme } from '../theme';
import { T, tap } from './ui';

/** Horizontal strip of the book's photos for a stop; tap to open a full-screen exhibit. */
export function PhotoStrip({ photos, height = 190 }: { photos: Photo[]; height?: number }) {
  const t = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
        {photos.map((p, i) => (
          <Pressable
            key={p.file}
            accessibilityRole="imagebutton"
            accessibilityLabel={p.caption ?? 'Photo from the book'}
            onPress={() => {
              tap();
              setOpen(i);
            }}
          >
            <Image source={photo(p.file)} style={{ height, width: Math.min(300, (height * p.w) / Math.max(1, p.h)), borderRadius: 16, backgroundColor: t.cardAlt }} contentFit="cover" transition={200} />
          </Pressable>
        ))}
      </ScrollView>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} />
    </>
  );
}

export function Lightbox({ photos, index, onClose }: { photos: Photo[]; index: number | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  return (
    <Modal visible={index !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.lb}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(p) => p.file}
          renderItem={({ item }) => (
            <View style={{ width, height, justifyContent: 'center' }}>
              <Image source={photo(item.file)} style={{ width, height: height * 0.72 }} contentFit="contain" />
              {item.caption ? (
                <T style={{ color: '#eee', textAlign: 'center', paddingHorizontal: 24, marginTop: 12 }} variant="italic">
                  {item.caption}
                </T>
              ) : null}
            </View>
          )}
        />
        <Pressable accessibilityLabel="Close" onPress={onClose} style={[styles.close, { top: insets.top + 10 }]}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  lb: { flex: 1, backgroundColor: '#050B0C' },
  close: { position: 'absolute', right: 18, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
