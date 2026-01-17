import { useStore } from '@/src/store-context';
import { Item } from '@/src/types';
import { ThemedSafeAreaView } from '@/components/themed-safe-area-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { FlatList, Image, Pressable, StyleSheet, View, ScrollView, Dimensions, Alert } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { Modal } from 'react-native';
import { FAB } from '@/components/fab';
import { AddSheet } from '@/components/add-sheet';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ImageViewer } from '@/components/image-viewer';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { saveImagesFromUris } from '@/src/storage';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - 32 - COLUMN_GAP) / 2; // 32 is horizontal padding (16*2)

export default function ClosetScreen() {
  const { store, saveItem, saveOutfit } = useStore();
  const roleId = store.currentRoleId;
  const router = useRouter();
  const params = useLocalSearchParams<{ initialCategory?: string }>();
  
  // Image Preview State
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const categories = roleId ? store.dictionaryByRole[roleId]?.categories ?? [] : [];
  const l1 = categories.filter(c => c.level === 1);
  const l2 = categories.filter(c => c.level === 2);
  const [activeL1, setActiveL1] = useState<string | '全部'>('全部');
  const [activeL2, setActiveL2] = useState<string | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);

  // Handle Initial Category Params from Stats Screen
  useEffect(() => {
    if (params.initialCategory) {
        // Find if it's L1 or L2
        const cat = categories.find(c => c.id === params.initialCategory);
        if (cat) {
            if (cat.level === 1) {
                setActiveL1(cat.id);
                setActiveL2(undefined);
            } else {
                setActiveL1(cat.parentId || '全部');
                setActiveL2(cat.id);
            }
        }
    }
  }, [params.initialCategory, categories]);
  
  // Multi-select Filters
  const [filterSeasons, setFilterSeasons] = useState<string[]>([]);
  const [filterSizes, setFilterSizes] = useState<string[]>([]);
  const [filterMaterials, setFilterMaterials] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [filterPalettes, setFilterPalettes] = useState<string[]>([]);
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const [filterUsageFrequencies, setFilterUsageFrequencies] = useState<string[]>([]);

  // Computed Locations from existing items
  const availableLocations = useMemo(() => {
    if (!roleId) return [];
    const locs = new Set<string>();
    store.items.filter(i => i.roleId === roleId && i.storageLocation).forEach(i => {
      if (i.storageLocation) locs.add(i.storageLocation);
    });
    return Array.from(locs).sort();
  }, [store.items, roleId]);

  const toggleFilter = (list: string[], item: string, setter: (l: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const applyFilters = (list: Item[]) => {
    return list.filter(it => {
      if (activeL1 !== '全部' && it.categoryL1Id !== activeL1) return false;
      if (activeL2 && it.categoryL2Id !== activeL2) return false;
      
      if (filterColors.length > 0 && (!it.color || !filterColors.includes(it.color))) return false;
      if (filterPalettes.length > 0 && (!it.palette || !filterPalettes.includes(it.palette))) return false;
      if (filterMaterials.length > 0 && (!it.material || !filterMaterials.includes(it.material))) return false;
      if (filterSizes.length > 0 && (!it.size || !filterSizes.includes(it.size))) return false;
      if (filterLocations.length > 0 && (!it.storageLocation || !filterLocations.includes(it.storageLocation))) return false;
      if (filterUsageFrequencies.length > 0 && (!it.usageFrequency || !filterUsageFrequencies.includes(it.usageFrequency))) return false;
      
      if (filterSeasons.length > 0) {
        // Match ANY selected season
        const seasonTagIds = store.dictionaryByRole[roleId!]?.tags
          .filter(t => t.type === 'season' && filterSeasons.includes(t.name))
          .map(t => t.id) || [];
        
        // If item has NONE of the selected season tags, filter it out
        const hasMatch = seasonTagIds.some(id => it.tagIds.includes(id));
        if (!hasMatch) return false;
      }
      return true;
    });
  };

  const resetFilters = () => {
    setFilterSeasons([]);
    setFilterSizes([]);
    setFilterMaterials([]);
    setFilterColors([]);
    setFilterPalettes([]);
    setFilterLocations([]);
    setFilterUsageFrequencies([]);
  };

  const items = applyFilters(store.items.filter(i => i.roleId === roleId));
  
  // Images for viewer (only those with URIs)
  const viewerImages = items.filter(i => i.imageUri).map(i => ({ uri: i.imageUri! }));
  
  const openViewer = (item: Item) => {
    if (!item.imageUri) return;
    const index = viewerImages.findIndex(img => img.uri === item.imageUri);
    if (index >= 0) {
        setCurrentImageIndex(index);
        setIsViewerVisible(true);
    }
  };

  const getFrequencyColor = (freq: string | undefined) => {
    switch (freq) {
      case '高': return '#FF6B6B'; // Red
      case '中': return '#4ECDC4'; // Teal
      case '低': return '#FFD93D'; // Yellow
      case '弃用': return '#95A5A6'; // Grey
      default: return null;
    }
  };

  return (
    <ThemedSafeAreaView style={styles.container}>
      {!roleId && <ThemedText>请先创建或选择角色</ThemedText>}
      {roleId && (
        <>
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                <Pressable
                style={[styles.tab, activeL1 === '全部' && styles.tabActive]}
                onPress={() => { setActiveL1('全部'); setActiveL2(undefined); }}>
                <ThemedText style={activeL1 === '全部' ? styles.tabTextActive : styles.tabText}>{activeL1 === '全部' ? '全部' : '全部'}</ThemedText>
                </Pressable>
                {l1.filter(c => c.name !== '全部').map(c => (
                <Pressable
                    key={c.id}
                    style={[styles.tab, activeL1 === c.id && styles.tabActive]}
                    onPress={() => { setActiveL1(c.id); setActiveL2(undefined); }}>
                    <ThemedText style={activeL1 === c.id ? styles.tabTextActive : styles.tabText}>{c.name}</ThemedText>
                </Pressable>
                ))}
            </ScrollView>
          </View>

          {activeL1 !== '全部' && (
             <View style={{ marginTop: 4 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                    {l2.filter(x => x.parentId === (activeL1 as string)).map(c => (
                        <Pressable
                        key={c.id}
                        style={[styles.tabSmall, activeL2 === c.id && styles.tabActive]}
                        onPress={() => setActiveL2(c.id)}>
                        <ThemedText style={activeL2 === c.id ? styles.tabTextActive : styles.tabText}>{c.name}</ThemedText>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
          )}
          <View style={{ alignItems: 'flex-end' }}>
            <Pressable style={styles.filterButton} onPress={() => setFilterOpen(true)}>
              <IconSymbol name="slider.horizontal.3" size={20} color={Colors.light.tint} />
              <ThemedText style={styles.filterButtonText}>筛选</ThemedText>
            </Pressable>
          </View>
        </>
      )}
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: COLUMN_GAP }}
        contentContainerStyle={{ gap: 12, paddingBottom: 80, flexGrow: 1 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: CARD_WIDTH }]}>
            {item.imageUri ? (
              <Pressable onPress={() => openViewer(item)} onLongPress={() => router.push({ pathname: '/edit-item/[id]', params: { id: item.id } })}>
                <Image source={{ uri: item.imageUri }} style={styles.thumb} />
              </Pressable>
            ) : (
              <View style={[styles.thumb, styles.placeholder]} />
            )}
            {/* Frequency Badge */}
            {item.usageFrequency && (
              <View style={[styles.badge, { backgroundColor: getFrequencyColor(item.usageFrequency) }]}>
                <ThemedText style={styles.badgeText}>{item.usageFrequency}</ThemedText>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <IconSymbol name="tray.fill" size={48} color="#E0E0E0" />
                <ThemedText style={styles.emptyText}>暂无单品</ThemedText>
            </View>
        }
      />
      
      {/* Filter Modal */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} />
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={{ marginBottom: 20, textAlign: 'center' }}>筛选条件</ThemedText>
            <ScrollView style={{ maxHeight: '80%' }}>
              <View style={{ gap: 20 }} onStartShouldSetResponder={() => true}>
                <View>
                   <ThemedText style={styles.filterLabel}>季节</ThemedText>
                   <View style={styles.chipRow}>
                     {store.dictionaryByRole[roleId!]?.tags.filter(t => t.type === 'season').map(t => (
                       <Pressable key={t.id} style={[styles.chip, filterSeasons.includes(t.name) && styles.chipActive]} onPress={() => toggleFilter(filterSeasons, t.name, setFilterSeasons)}>
                         <ThemedText style={filterSeasons.includes(t.name) ? styles.chipTextActive : styles.chipText}>{t.name}</ThemedText>
                       </Pressable>
                     ))}
                   </View>
                </View>
                
                <View>
                  <ThemedText style={styles.filterLabel}>尺码</ThemedText>
                  <View style={styles.chipRow}>
                    {['XS','S','M','L','XL','XXL'].map(s => (
                      <Pressable key={s} style={[styles.chip, filterSizes.includes(s) && styles.chipActive]} onPress={() => toggleFilter(filterSizes, s, setFilterSizes)}>
                        <ThemedText style={filterSizes.includes(s) ? styles.chipTextActive : styles.chipText}>{s}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View>
                   <ThemedText style={styles.filterLabel}>材质</ThemedText>
                   <View style={styles.chipRow}>
                     {['棉','麻','丝','羊毛','羊绒','皮革','化纤','羽绒','混纺'].map(s => (
                       <Pressable key={s} style={[styles.chip, filterMaterials.includes(s) && styles.chipActive]} onPress={() => toggleFilter(filterMaterials, s, setFilterMaterials)}>
                         <ThemedText style={filterMaterials.includes(s) ? styles.chipTextActive : styles.chipText}>{s}</ThemedText>
                       </Pressable>
                     ))}
                   </View>
                </View>

                <View>
                   <ThemedText style={styles.filterLabel}>颜色</ThemedText>
                   <View style={styles.chipRow}>
                     {['黑','白','灰','红','橙','黄','绿','蓝','紫','棕','米','卡其'].map(s => (
                       <Pressable key={s} style={[styles.chip, filterColors.includes(s) && styles.chipActive]} onPress={() => toggleFilter(filterColors, s, setFilterColors)}>
                         <ThemedText style={filterColors.includes(s) ? styles.chipTextActive : styles.chipText}>{s}</ThemedText>
                       </Pressable>
                     ))}
                   </View>
                </View>

                <View>
                   <ThemedText style={styles.filterLabel}>色系</ThemedText>
                   <View style={styles.chipRow}>
                     {['暖色','冷色','深色','浅色','中性'].map(s => (
                       <Pressable key={s} style={[styles.chip, filterPalettes.includes(s) && styles.chipActive]} onPress={() => toggleFilter(filterPalettes, s, setFilterPalettes)}>
                         <ThemedText style={filterPalettes.includes(s) ? styles.chipTextActive : styles.chipText}>{s}</ThemedText>
                       </Pressable>
                     ))}
                   </View>
                </View>

                <View>
                   <ThemedText style={styles.filterLabel}>存放位置</ThemedText>
                   {availableLocations.length > 0 ? (
                     <View style={styles.chipRow}>
                       {availableLocations.map(s => (
                         <Pressable key={s} style={[styles.chip, filterLocations.includes(s) && styles.chipActive]} onPress={() => toggleFilter(filterLocations, s, setFilterLocations)}>
                           <ThemedText style={filterLocations.includes(s) ? styles.chipTextActive : styles.chipText}>{s}</ThemedText>
                         </Pressable>
                       ))}
                     </View>
                   ) : (
                     <ThemedText style={{ color: '#CCC', fontSize: 13 }}>暂无存放位置记录</ThemedText>
                   )}
                </View>

                <View>
                   <ThemedText style={styles.filterLabel}>使用频率</ThemedText>
                   <View style={styles.chipRow}>
                     {['高','中','低','弃用'].map(s => (
                       <Pressable key={s} style={[styles.chip, filterUsageFrequencies.includes(s) && styles.chipActive]} onPress={() => toggleFilter(filterUsageFrequencies, s, setFilterUsageFrequencies)}>
                         <ThemedText style={filterUsageFrequencies.includes(s) ? styles.chipTextActive : styles.chipText}>{s}</ThemedText>
                       </Pressable>
                     ))}
                   </View>
                </View>
              </View>
            </ScrollView>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
              <Pressable style={[styles.actionButton, styles.resetButton]} onPress={resetFilters}>
                <ThemedText style={styles.resetButtonText}>重置</ThemedText>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.applyButton]} onPress={() => setFilterOpen(false)}>
                <ThemedText style={styles.applyButtonText}>应用</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      
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
        onPicked={(type, uri) => {
          if (type === 'item') {
            router.push({ pathname: '/add-item', params: { imageUri: uri } });
          } else {
            router.push({ pathname: '/add-outfit', params: { imageUri: uri } });
          }
        }}
      />
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: Colors.light.background },
  tabsContainer: { flexDirection: 'row', gap: 8, paddingRight: 16, paddingVertical: 8 },
  tab: { 
      backgroundColor: '#FFF', 
      borderRadius: 20, 
      paddingHorizontal: 16, 
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: '#EEE',
  },
  tabSmall: { 
      backgroundColor: '#FFF', 
      borderRadius: 16, 
      paddingHorizontal: 12, 
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: '#EEE',
  },
  tabActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  tabText: { color: '#666', fontSize: 14 },
  tabTextActive: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  
  filterButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  filterButtonText: { color: Colors.light.tint, fontWeight: '600' },

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
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  filterLabel: { marginBottom: 12, fontWeight: '600', color: '#333', fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { 
      backgroundColor: '#F5F5F5', 
      borderRadius: 16, 
      paddingHorizontal: 12, 
      paddingVertical: 8,
  },
  chipActive: { backgroundColor: Colors.light.tint },
  chipText: { color: '#666', fontSize: 13 },
  chipTextActive: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  resetButton: { backgroundColor: '#F5F5F5' },
  applyButton: { backgroundColor: Colors.light.tint },
  resetButtonText: { color: '#666', fontWeight: '600' },
  applyButtonText: { color: '#FFF', fontWeight: '600' },

  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
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
