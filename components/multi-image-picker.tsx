import { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Pressable, FlatList, Image, Dimensions, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GAP = 8;
const COLS = 3;
const ITEM_SIZE = (width - 32 - GAP * (COLS - 1)) / COLS;

type SourceType = 'library' | 'camera';

export function MultiImagePicker({
  visible,
  source,
  onClose,
  onConfirm,
  max = 12,
}: {
  visible: boolean;
  source: SourceType;
  onClose: () => void;
  onConfirm: (uris: string[]) => void;
  max?: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [endReached, setEndReached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [after, setAfter] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelected([]);
      setAssets([]);
      setAfter(null);
      setEndReached(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (source === 'library') {
      (async () => {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('权限不足', '请授权相册访问以选择图片');
          return;
        }
        await loadMore();
      })();
    } else {
      (async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('权限不足', '请授权相机访问以拍摄图片');
          return;
        }
      })();
    }
  }, [visible, source]);

  const loadMore = async () => {
    if (loading || endReached) return;
    setLoading(true);
    const res = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 60,
      after: after ?? undefined,
      sortBy: MediaLibrary.SortBy.creationTime,
    });
    setAssets(prev => [...prev, ...res.assets]);
    setAfter(res.endCursor ?? null);
    setEndReached(!res.hasNextPage);
    setLoading(false);
  };

  const toggleSelect = (uri: string) => {
    if (selected.includes(uri)) {
      setSelected(selected.filter(u => u !== uri));
    } else {
      if (selected.length >= max) {
        Alert.alert('已达上限', `最多选择${max}张`);
        return;
      }
      setSelected([...selected, uri]);
    }
  };

  const removeSelected = (uri: string) => {
    setSelected(selected.filter(u => u !== uri));
  };

  const takePhoto = async () => {
    if (selected.length >= max) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const uri = res.assets[0].uri;
      if (!selected.includes(uri)) {
        setSelected(prev => (prev.length < max ? [...prev, uri] : prev));
      }
    }
  };

  const confirm = () => {
    if (selected.length === 0) {
      Alert.alert('未选择图片', '请至少选择一张图片');
      return;
    }
    onConfirm(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <IconSymbol name="xmark.circle.fill" size={24} color="#C7C7CC" />
            </Pressable>
            <ThemedText type="subtitle" style={{ fontSize: 18 }}>
              已选 {selected.length}/{max}
            </ThemedText>
            <Pressable onPress={confirm} style={styles.doneBtn}>
              <ThemedText style={styles.doneText}>完成</ThemedText>
            </Pressable>
          </View>

          {source === 'library' ? (
            <FlatList
              data={assets}
              keyExtractor={a => a.id}
              numColumns={COLS}
              columnWrapperStyle={{ gap: GAP }}
              contentContainerStyle={{ gap: GAP }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              renderItem={({ item }) => {
                const uri = item.uri;
                const isSelected = selected.includes(uri);
                const index = selected.indexOf(uri);
                return (
                  <Pressable onPress={() => toggleSelect(uri)} style={{ width: ITEM_SIZE, height: ITEM_SIZE }}>
                    <Image source={{ uri }} style={styles.thumb} />
                    {isSelected && (
                      <View style={styles.selectedOverlay}>
                        <ThemedText style={styles.selectedIndex}>{index + 1}</ThemedText>
                        <Pressable onPress={() => removeSelected(uri)} style={styles.closeIcon}>
                          <IconSymbol name="xmark.circle.fill" size={18} color="#FFF" />
                        </Pressable>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          ) : (
            <View style={styles.cameraContainer}>
              <View style={styles.selectedRow}>
                {selected.map(u => (
                  <View key={u} style={styles.selectedItem}>
                    <Image source={{ uri: u }} style={styles.selectedThumb} />
                    <Pressable onPress={() => removeSelected(u)} style={styles.closeIconSmall}>
                      <IconSymbol name="xmark.circle.fill" size={16} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
              <Pressable style={styles.captureBtn} onPress={takePhoto} disabled={selected.length >= max}>
                <ThemedText style={styles.captureText}>{selected.length >= max ? '已达上限' : '拍照'}</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doneBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.light.tint, borderRadius: 12 },
  doneText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  thumb: { width: '100%', height: '100%', borderRadius: 8 },
  selectedOverlay: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 2, borderColor: Colors.light.tint, borderRadius: 8, justifyContent: 'flex-start', alignItems: 'flex-start' },
  selectedIndex: { backgroundColor: Colors.light.tint, color: '#FFF', fontSize: 12, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  closeIcon: { position: 'absolute', top: 6, right: 6 },
  cameraContainer: { gap: 12 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedItem: { width: ITEM_SIZE, height: ITEM_SIZE },
  selectedThumb: { width: '100%', height: '100%', borderRadius: 8 },
  closeIconSmall: { position: 'absolute', top: 4, right: 4 },
  captureBtn: { alignSelf: 'center', backgroundColor: Colors.light.tint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  captureText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
})
