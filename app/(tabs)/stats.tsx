import { useStore } from '@/src/store-context';
import { ThemedSafeAreaView } from '@/components/themed-safe-area-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { StyleSheet, View, Pressable, Modal, TextInput, Image, Dimensions, ScrollView, Alert, Platform } from 'react-native';
import { useMemo, useState } from 'react';
import { FAB } from '@/components/fab';
import { AddSheet } from '@/components/add-sheet';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SEASONS } from '@/src/constants';
import { saveImagesFromUris } from '@/src/storage';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const { width } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2; // 32 = horizontal padding
const SLOGANS = [
  '衣天比一天好！',
  '知足常乐！',
  '寻找遗失的美好！',
  '前行必有曙光！ ',
  'Let go, move on.',
  'Smile every day.',
];

export default function StatsScreen() {
  const { store, saveRole, setRole, deleteRole } = useStore();
  const router = useRouter();
  const roleId = store.currentRoleId;
  const items = store.items.filter(i => i.roleId === roleId);
  const outfits = store.outfits.filter(o => o.roleId === roleId);

  // Stats Logic
  const categories = useMemo(() => (roleId ? store.dictionaryByRole[roleId]?.categories ?? [] : []), [store, roleId]);
  const l1 = categories.filter(c => c.level === 1 && c.name !== '全部');

  // Item Stats by Category
  const categoryStats = useMemo(() => {
    return l1.map(cat => {
      const catItems = items.filter(i => i.categoryL1Id === cat.id);
      catItems.sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        id: cat.id,
        name: cat.name,
        count: catItems.length,
        latestImage: catItems[0]?.imageUri
      };
    }).filter(s => s.count > 0);
  }, [items, l1]);

  // Outfit Stats by Season
  const seasonStats = useMemo(() => {
    return SEASONS.map(season => {
      const seasonOutfits = outfits.filter(o => o.season?.includes(season));
      seasonOutfits.sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        id: season,
        name: season,
        count: seasonOutfits.length,
        latestImage: seasonOutfits[0]?.previewUri
      };
    }).filter(s => s.count > 0);
  }, [outfits]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const navigateToCloset = (categoryId: string) => {
      router.push({ pathname: '/(tabs)/closet', params: { initialCategory: categoryId } });
  };

  const navigateToOutfits = (season: string) => {
      router.push({ pathname: '/(tabs)/outfits', params: { initialSeason: season } });
  };

  const handleDeleteRole = async (rId: string) => {
    if (store.roles.length <= 1) {
        Alert.alert('无法删除', '至少需要保留一个角色');
        return;
    }
    Alert.alert('删除角色', '确定要删除该角色及其所有数据吗？此操作不可恢复。', [
        { text: '取消', style: 'cancel' },
        { 
            text: '删除', 
            style: 'destructive', 
            onPress: async () => {
                await deleteRole(rId);
                // If we deleted the current role (and sheet is open), we might want to close sheet or update UI
                // The store update will trigger re-render.
                if (store.roles.length === 1) setSheetOpen(false); 
            }
        }
    ]);
  };

  const handleBatchPicked = async (type: 'item' | 'outfit', uris: string[]) => {
    if (!roleId) {
      Alert.alert('请先选择角色');
      return;
    }
    try {
      const savedUris = await saveImagesFromUris(uris);
      const now = Date.now();
      if (type === 'item') {
        for (const su of savedUris) {
          const item = { id: uid(), roleId, imageUri: su, createdAt: now, updatedAt: now };
          await saveItem(item as any);
        }
        Alert.alert('已添加', `成功添加 ${savedUris.length} 个单品`);
        router.push('/(tabs)/closet');
      } else {
        for (const su of savedUris) {
          const outfit = { id: uid(), roleId, previewUri: su, itemIds: [], createdAt: now, updatedAt: now };
          await saveOutfit(outfit as any);
        }
        Alert.alert('已添加', `成功添加 ${savedUris.length} 个搭配`);
        router.push('/(tabs)/outfits');
      }
    } catch (e) {
      Alert.alert('保存失败', '请重试');
    }
  };

  return (
    <ThemedSafeAreaView style={styles.container}>
      {store.roles.length === 0 && (
        <View style={styles.onboard}>
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginBottom: 20 }}>欢迎使用{'\n'}请先创建您的衣橱角色</ThemedText>
          <TextInput
            placeholder="例如：我的日常、度假穿搭..."
            value={newRoleName}
            onChangeText={setNewRoleName}
            style={styles.input}
            placeholderTextColor="#999"
          />
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              const name = newRoleName.trim();
              if (!name) return;
              const now = Date.now();
              const role = { id: uid(), name, createdAt: now, updatedAt: now };
              await saveRole(role);
              await setRole(role.id);
              setNewRoleName('');
            }}>
            <ThemedText style={styles.primaryButtonText}>开始旅程</ThemedText>
          </Pressable>
        </View>
      )}
      {store.roles.length > 0 && (
        <>
          {/* Header Role Switcher - Centered & Elegant */}
          <View style={styles.header}>
            <Pressable onPress={() => setSloganIndex((prev) => (prev + 1) % SLOGANS.length)}>
                <ThemedText style={styles.slogan}>{SLOGANS[sloganIndex]}</ThemedText>
            </Pressable>
            <Pressable style={styles.roleButton} onPress={() => setSheetOpen(true)}>
              <ThemedText style={styles.roleButtonText}>{store.roles.find(r => r.id === roleId)?.name ?? '选择角色'}</ThemedText>
              <IconSymbol name="chevron.down" size={14} color="#666" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
            {/* Top Summary Cards - Clean & Minimal */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryLabel}>单品</ThemedText>
              <ThemedText style={styles.summaryValue}>{items.length}</ThemedText>
            </View>
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryLabel}>搭配</ThemedText>
              <ThemedText style={styles.summaryValue}>{outfits.length}</ThemedText>
            </View>
          </View>

          {/* Category Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>单品分类</ThemedText>
                {/* Optional: Add 'View All' or similar if needed */}
            </View>
            <View style={styles.grid}>
              {categoryStats.map(stat => (
                <Pressable key={stat.id} style={styles.statCard} onPress={() => navigateToCloset(stat.id)}>
                   {stat.latestImage ? (
                    <Image source={{ uri: stat.latestImage }} style={styles.statImage} />
                  ) : (
                    <View style={[styles.statImage, styles.placeholder]} />
                  )}
                  <View style={styles.statInfo}>
                    <ThemedText style={styles.statName}>{stat.name}</ThemedText>
                    <ThemedText style={styles.statCount}>{stat.count}件</ThemedText>
                  </View>
                </Pressable>
              ))}
              {categoryStats.length === 0 && (
                  <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyStateText}>暂无单品数据</ThemedText>
                  </View>
              )}
            </View>
          </View>

          {/* Outfit Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>搭配灵感</ThemedText>
            </View>
            <View style={styles.grid}>
              {seasonStats.map(stat => (
                <Pressable key={stat.id} style={styles.statCard} onPress={() => navigateToOutfits(stat.name)}>
                  {stat.latestImage ? (
                    <Image source={{ uri: stat.latestImage }} style={styles.statImage} />
                  ) : (
                    <View style={[styles.statImage, styles.placeholder]} />
                  )}
                  <View style={styles.statInfo}>
                    <ThemedText style={styles.statName}>{stat.name}</ThemedText>
                    <ThemedText style={styles.statCount}>{stat.count}套</ThemedText>
                  </View>
                </Pressable>
              ))}
              {seasonStats.length === 0 && (
                  <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyStateText}>暂无搭配数据</ThemedText>
                  </View>
              )}
            </View>
          </View>

        </ScrollView>
        </>
      )}

      {/* Role Switcher Modal - Refined */}
      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetOpen(false)} />
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={{ marginBottom: 20, textAlign: 'center' }}>切换角色</ThemedText>
            <ScrollView style={{ maxHeight: 300 }}>
                {store.roles.map(r => (
                <View key={r.id} style={styles.roleRow}>
                    {editingRoleId === r.id ? (
                      <>
                        <View style={styles.roleRowLeft}>
                          <View style={[styles.roleDot, store.currentRoleId === r.id && styles.roleDotActive]} />
                          <TextInput
                            value={editingName}
                            onChangeText={text => setEditingName(text)}
                            placeholder="用户名"
                            maxLength={4}
                            style={styles.inputInline}
                            placeholderTextColor="#999"
                          />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Pressable
                            style={styles.actionIcon}
                            onPress={async () => {
                              const name = editingName.trim();
                              if (!name || name.length > 4) {
                                Alert.alert('名称不合法', '用户名需为1-4个字');
                                return;
                              }
                              const now = Date.now();
                              const orig = store.roles.find(x => x.id === r.id)!;
                              await saveRole({ ...orig, name, updatedAt: now });
                              setEditingRoleId(null);
                              setEditingName('');
                            }}>
                            <IconSymbol name="checkmark" size={18} color={Colors.light.tint} />
                          </Pressable>
                          <Pressable
                            style={styles.actionIcon}
                            onPress={() => { setEditingRoleId(null); setEditingName(''); }}>
                            <IconSymbol name="xmark.circle.fill" size={18} color="#C7C7CC" />
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <>
                        <Pressable onPress={() => { setRole(r.id); setSheetOpen(false); }} style={styles.roleRowLeft}>
                          <View style={[styles.roleDot, store.currentRoleId === r.id && styles.roleDotActive]} />
                          <ThemedText style={[styles.roleName, store.currentRoleId === r.id && styles.roleNameActive]}>
                            {r.name}
                          </ThemedText>
                        </Pressable>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Pressable style={styles.actionIcon} onPress={() => { setEditingRoleId(r.id); setEditingName(r.name); }}>
                            <IconSymbol name="pencil" size={18} color={Colors.light.tint} />
                          </Pressable>
                          <Pressable style={styles.actionIcon} onPress={() => handleDeleteRole(r.id)}>
                            <IconSymbol name="trash" size={18} color="#C7C7CC" />
                          </Pressable>
                        </View>
                      </>
                    )}
                </View>
                ))}
            </ScrollView>
            
            <View style={styles.divider} />
            
            <View style={styles.addRoleContainer}>
              <TextInput
                placeholder="新建角色..."
                value={newRoleName}
                onChangeText={setNewRoleName}
                style={styles.inputSmall}
                placeholderTextColor="#999"
              />
              <Pressable
                style={styles.addButtonSmall}
                onPress={async () => {
                  const name = newRoleName.trim();
                  if (!name) return;
                  const now = Date.now();
                  const role = { id: uid(), name, createdAt: now, updatedAt: now };
                  await saveRole(role);
                  await setRole(role.id);
                  setNewRoleName('');
                }}>
                <IconSymbol name="plus" size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: Colors.light.background },
  onboard: { flex: 1, justifyContent: 'center', padding: 32 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    zIndex: 10,
  },
  slogan: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#333',
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  
  summaryContainer: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginBottom: 32 },
  summaryCard: { 
      flex: 1, 
      backgroundColor: '#FFF', 
      padding: 20, 
      borderRadius: 20, 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
  },
  summaryLabel: { color: '#999', fontSize: 13, letterSpacing: 1 },
  summaryValue: { color: '#333', fontSize: 32, fontWeight: '300', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light' },

  section: { paddingHorizontal: 16, marginBottom: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, color: '#333' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  statCard: { 
      width: CARD_WIDTH, 
      backgroundColor: '#FFF', 
      borderRadius: 16, 
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 3,
  },
  statImage: { width: '100%', aspectRatio: 0.85, backgroundColor: '#F5F5F5' },
  statInfo: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  statName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  statCount: { fontSize: 12, color: '#999' },
  placeholder: { backgroundColor: '#F0F0F0' },
  emptyState: { width: '100%', padding: 20, alignItems: 'center' },
  emptyStateText: { color: '#CCC', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  roleRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  roleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EEE' },
  roleDotActive: { backgroundColor: Colors.light.tint },
  roleName: { fontSize: 16, color: '#666' },
  roleNameActive: { color: '#333', fontWeight: '600' },
  actionIcon: { padding: 8 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },
  addRoleContainer: { flexDirection: 'row', gap: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  inputSmall: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15 },
  addButtonSmall: { width: 48, height: 48, backgroundColor: Colors.light.tint, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: Colors.light.tint, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  inputInline: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 15 },
});

