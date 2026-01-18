import { AddSheet } from '@/components/add-sheet';
import { FAB } from '@/components/fab';
import { ImageViewer } from '@/components/image-viewer';
import { OptimizedImage } from '@/components/optimized-image';
import { ThemedSafeAreaView } from '@/components/themed-safe-area-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ensureThumbnail, getThumbnailUri } from '@/src/image-utils';
import { useStore } from '@/src/store-context';
import { Outfit } from '@/src/types';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - 32 - COLUMN_GAP) / 2;

export default function OutfitsScreen() {
  const { store, saveOutfit } = useStore();
  const router = useRouter();
  const params = useLocalSearchParams<{ initialSeason?: string }>();
  const roleId = store.currentRoleId;
  const [addOpen, setAddOpen] = useState(false);
  const [activeSeason, setActiveSeason] = useState<string | '全部'>('全部');
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle initial filter param
  useEffect(() => {
    if (params.initialSeason) {
      setActiveSeason(params.initialSeason);
    }
  }, [params.initialSeason]);

  const seasons = ['全部', '春', '夏', '秋', '冬', '四季通用'];

  const outfits = store.outfits.filter(o => o.roleId === roleId);
  const filteredOutfits = activeSeason === '全部' 
    ? outfits 
    : outfits.filter(o => o.season?.includes(activeSeason));

  // 后台自动修复缺失的缩略图
  useEffect(() => {
    if (filteredOutfits.length > 0) {
      filteredOutfits.forEach(async (outfit) => {
        if (outfit.previewUri) {
          await ensureThumbnail(outfit.previewUri);
        }
      });
    }
  }, [filteredOutfits.length]);

  const viewerImages = filteredOutfits.filter(o => o.previewUri).map(o => ({ uri: o.previewUri! }));

  const openViewer = (outfit: Outfit) => {
    if (!outfit.previewUri) return;
    const index = viewerImages.findIndex(img => img.uri === outfit.previewUri);
    if (index >= 0) {
        setCurrentImageIndex(index);
        setIsViewerVisible(true);
    }
  };

  // FlashList renderItem
  const renderItem = useCallback(({ item }: { item: Outfit }) => {
    const thumbnailUri = item.previewUri ? getThumbnailUri(item.previewUri) : undefined;
    
    return (
      <View style={[styles.cardContainer, { width: CARD_WIDTH }]}>
        <View style={styles.card}>
          {item.previewUri ? (
            <Pressable 
              onPress={() => openViewer(item)} 
              onLongPress={() => router.push({ pathname: '/edit-outfit/[id]', params: { id: item.id } })}
            >
              <OptimizedImage
                uri={thumbnailUri}
                originalUri={item.previewUri}
                style={styles.thumb}
                contentFit="cover"
                borderRadius={16}
                lazy={true}
                showLoader={true}
              />
            </Pressable>
          ) : (
            <View style={[styles.thumb, styles.placeholder]} />
          )}
        </View>
      </View>
    );
  }, [router]);

  return (
    <ThemedSafeAreaView style={styles.container}>
      {!roleId && <ThemedText>请先在“角色”标签选择当前角色</ThemedText>}
      {roleId && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {seasons.map(s => (
              <Pressable
                key={s}
                style={[styles.tab, activeSeason === s && styles.tabActive]}
                onPress={() => setActiveSeason(s)}>
                <ThemedText style={activeSeason === s ? styles.tabTextActive : styles.tabText}>{s}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <FlashList
        data={filteredOutfits}
        renderItem={renderItem}
        keyExtractor={(o) => o.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 8 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <IconSymbol name="person.2.fill" size={48} color="#E0E0E0" />
                <ThemedText style={styles.emptyText}>暂无搭配</ThemedText>
            </View>
        }
      />

      {/* Image Viewer */}
      <ImageViewer
        imageUri={viewerImages[currentImageIndex]?.uri}
        visible={isViewerVisible}
        onClose={() => setIsViewerVisible(false)}
      />

      <FAB onPress={() => setAddOpen(true)} />
      <AddSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onPicked={(type, uris) => {
          if (type === 'item') {
            router.push({ pathname: '/add-item', params: { imageUris: JSON.stringify(uris) } });
          } else {
            router.push({ pathname: '/add-outfit', params: { imageUris: JSON.stringify(uris) } });
          }
        }}
      />
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  tabsContainer: { flexDirection: 'row', gap: 8, paddingRight: 16, paddingVertical: 8, paddingLeft: 16 },
  cardContainer: {
    padding: 6, // 增加四周间距，形成行间距和列间距
  },
  tab: { 
      backgroundColor: '#FFF', 
      borderRadius: 20, 
      paddingHorizontal: 16, 
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: '#EEE',
  },
  tabActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  tabText: { color: '#666', fontSize: 14 },
  tabTextActive: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 0, 
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#F0F0F0' },
  emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
      opacity: 0.5,
  },
  emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: '#999',
  }
});
