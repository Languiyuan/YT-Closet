import { pickMultipleImages, takePhoto as takeCameraPhoto } from '@/components/multi-image-picker';
import { ThemedSafeAreaView } from '@/components/themed-safe-area-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { COLORS, MATERIALS, PALETTES, SEASONS, SIZES_CLOTHING, SIZES_SHOE } from '@/src/constants';
import { saveImageFromUri, saveImagesFromUris } from '@/src/storage';
import { useStore } from '@/src/store-context';
import { Item } from '@/src/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AddItemScreen() {
  const { store, saveItem } = useStore();
  const roleId = store.currentRoleId;
  const params = useLocalSearchParams<{ imageUri?: string; imageUris?: string }>();
  const router = useRouter();

  // 处理初始图片：支持单图imageUri和多图imageUris
  const initialUris = useMemo(() => {
    if (params.imageUris) {
      try {
        return JSON.parse(params.imageUris as string) as string[];
      } catch {
        return [];
      }
    }
    if (params.imageUri) {
      return [params.imageUri as string];
    }
    return [];
  }, [params.imageUri, params.imageUris]);

  // Form State
  const [selectedUris, setSelectedUris] = useState<string[]>(initialUris);
  const [catL1Id, setCatL1Id] = useState<string | undefined>(undefined);
  const [catL2Id, setCatL2Id] = useState<string | undefined>(undefined);
  const [seasonTags, setSeasonTags] = useState<string[]>([]);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [material, setMaterial] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(undefined);
  const [palette, setPalette] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>(undefined);
  const [usageFrequency, setUsageFrequency] = useState<'高' | '中' | '低' | '弃用' | undefined>(undefined);

  // Modals
  const [activeModal, setActiveModal] = useState<'category' | 'season' | 'size' | 'material' | 'color' | 'palette' | 'location' | 'date' | 'usageFrequency' | null>(null);

  // Data
  const categories = useMemo(() => (roleId ? store.dictionaryByRole[roleId]?.categories ?? [] : []), [store, roleId]);
  const l1 = useMemo(() => categories.filter(c => c.level === 1 && c.name !== '全部'), [categories]);
  const l2 = useMemo(() => categories.filter(c => c.level === 2), [categories]);
  
  // Recent locations
  const recentLocations = useMemo(() => {
    if (!roleId) return [];
    const locs: Record<string, number> = {};
    store.items.filter(i => i.roleId === roleId && i.storageLocation).forEach(i => {
      if (i.storageLocation) locs[i.storageLocation] = (locs[i.storageLocation] || 0) + 1;
    });
    return Object.entries(locs).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 8);
  }, [store.items, roleId]);

  // Image Handling
  const chooseLibrary = async () => {
    // 检查是否已达到最大数量
    if (selectedUris.length >= 12) {
      Alert.alert('已达上限', '最多选择12张图片');
      return;
    }
    
    const remainingSlots = 12 - selectedUris.length;
    const uris = await pickMultipleImages({ maxSelection: remainingSlots, quality: 0.8 });
    
    if (uris.length > 0) {
      const savedUris = await saveImagesFromUris(uris);
      setSelectedUris(prev => [...prev, ...savedUris]);
    }
  };
  
  const takePhoto = async () => {
    if (selectedUris.length >= 12) {
      Alert.alert('已达上限', '最多选择12张图片');
      return;
    }
    
    const uri = await takeCameraPhoto(0.8);
    if (uri) {
      const saved = await saveImageFromUri(uri);
      setSelectedUris(prev => [...prev, saved]);
    }
  };
  const handleEditImage = () => {
    setImagePickOpen(true);
  };
  const [imagePickOpen, setImagePickOpen] = useState(false);

  const save = async () => {
    if (!roleId) return;
    if (!catL1Id) {
      alert('请选择分类');
      return;
    }
    const now = Date.now();
    // Map season names to tag IDs
    const seasonTagIds = seasonTags.map(s => {
      const t = store.dictionaryByRole[roleId]?.tags.find(tag => tag.name === s && tag.type === 'season');
      return t ? t.id : null;
    }).filter(x => x) as string[];

    for (const uri of selectedUris) {
      const item: Item = {
        id: uid(),
        roleId,
        imageUri: uri,
        categoryL1Id: catL1Id,
        categoryL2Id: catL2Id,
        color,
        size,
        material,
        storageLocation: location,
        purchaseDate,
        usageFrequency,
        palette: palette as any,
        tagIds: seasonTagIds,
        createdAt: now,
        updatedAt: now,
      };
      await saveItem(item);
    }
    router.replace('/(tabs)/closet');
  };

  // UI Helpers
  const renderRow = (label: string, value: string | undefined, onPress: () => void) => (
    <Pressable style={styles.row} onPress={onPress}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
        <ThemedText style={[styles.value, !value && styles.placeholderText]} numberOfLines={1}>
          {value || '请选择'}
        </ThemedText>
        <IconSymbol name="chevron.right" size={20} color="#C7C7CC" />
      </View>
    </Pressable>
  );

  const currentL1Name = l1.find(c => c.id === catL1Id)?.name;
  const currentL2Name = l2.find(c => c.id === catL2Id)?.name;

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Image Section */}
        <View style={styles.imageGrid}>
          {selectedUris.length === 0 && <View style={[styles.gridThumb, styles.placeholder]} />}
          {selectedUris.map(uri => (
            <View key={uri} style={styles.gridThumb}>
              <Image source={{ uri }} style={styles.gridImage} />
              <Pressable style={styles.gridRemove} onPress={() => setSelectedUris(prev => prev.filter(u => u !== uri))}>
                <IconSymbol name="xmark.circle.fill" size={18} color="#FFF" />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.editButton} onPress={handleEditImage}>
            <IconSymbol name="plus" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {renderRow('类别', catL1Id ? `${currentL1Name || ''} ${currentL2Name ? '- ' + currentL2Name : ''}` : undefined, () => setActiveModal('category'))}
          {renderRow('季节', seasonTags.length > 0 ? seasonTags.join('、') : undefined, () => setActiveModal('season'))}
          {renderRow('尺码', size, () => setActiveModal('size'))}
          {renderRow('材质', material, () => setActiveModal('material'))}
          {renderRow('颜色', color, () => setActiveModal('color'))}
          {renderRow('色系', palette, () => setActiveModal('palette'))}
          {renderRow('存放位置', location, () => setActiveModal('location'))}
          {renderRow('购买时间', purchaseDate, () => setActiveModal('date'))}
          {renderRow('使用频率', usageFrequency, () => setActiveModal('usageFrequency'))}
        </View>
        
        <Pressable style={styles.saveButton} onPress={save}>
          <ThemedText style={styles.saveButtonText}>保存</ThemedText>
        </Pressable>
      </ScrollView>

      {/* Modals */}
      
      {/* Category Modal */}
      <BottomModal visible={activeModal === 'category'} onClose={() => setActiveModal(null)} title="选择类别">
        <View style={{ flexDirection: 'row', height: 300 }}>
          <ScrollView style={{ flex: 1, borderRightWidth: 1, borderColor: '#EEE' }}>
            {l1.map(c => (
              <Pressable key={c.id} style={[styles.pickerItem, catL1Id === c.id && styles.pickerItemSelected]} onPress={() => { setCatL1Id(c.id); setCatL2Id(undefined); }}>
                <ThemedText style={catL1Id === c.id ? styles.pickerItemTextSelected : undefined}>{c.name}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            {catL1Id && l2.filter(c => c.parentId === catL1Id).map(c => (
              <Pressable key={c.id} style={[styles.pickerItem, catL2Id === c.id && styles.pickerItemSelected]} onPress={() => { setCatL2Id(c.id); setActiveModal(null); }}>
                <ThemedText style={catL2Id === c.id ? styles.pickerItemTextSelected : undefined}>{c.name}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </BottomModal>

      {/* Season Modal */}
      <BottomModal visible={activeModal === 'season'} onClose={() => setActiveModal(null)} title="选择季节 (可多选)">
        <View style={styles.chipContainer}>
          {SEASONS.map(s => {
            const selected = seasonTags.includes(s);
            return (
              <Pressable key={s} style={[styles.chip, selected && styles.chipSelected]} onPress={() => {
                if (selected) setSeasonTags(prev => prev.filter(x => x !== s));
                else setSeasonTags(prev => [...prev, s]);
              }}>
                <ThemedText style={selected ? styles.chipTextSelected : undefined}>{s}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </BottomModal>

      {/* Size Modal */}
      <BottomModal visible={activeModal === 'size'} onClose={() => setActiveModal(null)} title="选择尺码">
        <View style={styles.chipContainer}>
          {(currentL1Name === '鞋子' ? SIZES_SHOE : SIZES_CLOTHING).map(s => (
            <Pressable key={s} style={[styles.chip, size === s && styles.chipSelected]} onPress={() => { setSize(s); setActiveModal(null); }}>
              <ThemedText style={size === s ? styles.chipTextSelected : undefined}>{s}</ThemedText>
            </Pressable>
          ))}
        </View>
      </BottomModal>

      {/* Material Modal */}
      <BottomModal visible={activeModal === 'material'} onClose={() => setActiveModal(null)} title="选择材质">
        <View style={styles.chipContainer}>
          {MATERIALS.map(m => (
            <Pressable key={m} style={[styles.chip, material === m && styles.chipSelected]} onPress={() => { setMaterial(m); setActiveModal(null); }}>
              <ThemedText style={material === m ? styles.chipTextSelected : undefined}>{m}</ThemedText>
            </Pressable>
          ))}
        </View>
      </BottomModal>

      {/* Color Modal */}
      <BottomModal visible={activeModal === 'color'} onClose={() => setActiveModal(null)} title="选择颜色">
        <View style={styles.chipContainer}>
          {COLORS.map(c => (
            <Pressable key={c} style={[styles.chip, color === c && styles.chipSelected]} onPress={() => { setColor(c); setActiveModal(null); }}>
              <ThemedText style={color === c ? styles.chipTextSelected : undefined}>{c}</ThemedText>
            </Pressable>
          ))}
        </View>
      </BottomModal>

      {/* Palette Modal */}
      <BottomModal visible={activeModal === 'palette'} onClose={() => setActiveModal(null)} title="选择色系">
        <View style={styles.chipContainer}>
          {PALETTES.map(p => (
            <Pressable key={p} style={[styles.chip, palette === p && styles.chipSelected]} onPress={() => { setPalette(p); setActiveModal(null); }}>
              <ThemedText style={palette === p ? styles.chipTextSelected : undefined}>{p}</ThemedText>
            </Pressable>
          ))}
        </View>
      </BottomModal>

      {/* Usage Frequency Modal */}
      <BottomModal visible={activeModal === 'usageFrequency'} onClose={() => setActiveModal(null)} title="使用频率">
        <View style={styles.chipContainer}>
          {['高', '中', '低', '弃用'].map(f => (
            <Pressable key={f} style={[styles.chip, usageFrequency === f && styles.chipSelected]} onPress={() => { setUsageFrequency(f as any); setActiveModal(null); }}>
              <ThemedText style={usageFrequency === f ? styles.chipTextSelected : undefined}>{f}</ThemedText>
            </Pressable>
          ))}
        </View>
      </BottomModal>

      {/* Location Modal */}
      <BottomModal visible={activeModal === 'location'} onClose={() => setActiveModal(null)} title="存放位置">
        <View style={{ gap: 16 }}>
          <TextInput
            style={styles.input}
            placeholder="输入存放位置"
            value={location}
            onChangeText={setLocation}
            autoFocus
          />
          <View>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>最近 / 常用</ThemedText>
            <View style={styles.chipContainer}>
              {recentLocations.map(loc => (
                <Pressable key={loc} style={[styles.chip, location === loc && styles.chipSelected]} onPress={() => setLocation(loc)}>
                  <ThemedText style={location === loc ? styles.chipTextSelected : undefined}>{loc}</ThemedText>
                </Pressable>
              ))}
              {recentLocations.length === 0 && <ThemedText style={{ color: '#999' }}>暂无记录</ThemedText>}
            </View>
          </View>
          <Pressable style={styles.saveButton} onPress={() => setActiveModal(null)}>
            <ThemedText style={styles.saveButtonText}>确定</ThemedText>
          </Pressable>
        </View>
      </BottomModal>

      {/* Date Modal (Simple Picker) */}
      <BottomModal visible={activeModal === 'date'} onClose={() => setActiveModal(null)} title="购买时间">
        <View style={{ height: 250 }}>
             <DatePicker value={purchaseDate} onChange={setPurchaseDate} />
             <Pressable style={[styles.saveButton, { marginTop: 16 }]} onPress={() => setActiveModal(null)}>
               <ThemedText style={styles.saveButtonText}>确定</ThemedText>
             </Pressable>
        </View>
      </BottomModal>

      {/* Image Pick Modal */}
      <Modal visible={imagePickOpen} transparent animationType="fade" onRequestClose={() => setImagePickOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setImagePickOpen(false)}>
          <View style={styles.centerModal}>
            <View style={styles.modalContent}>
              <Pressable style={styles.modalBtn} onPress={() => { setImagePickOpen(false); takePhoto(); }}>
                <ThemedText>拍照</ThemedText>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={styles.modalBtn} onPress={() => { setImagePickOpen(false); chooseLibrary(); }}>
                <ThemedText>从相册选择</ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

    </ThemedSafeAreaView>
  );
}

function BottomModal({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <Pressable onPress={onClose}>
               <IconSymbol name="xmark.circle.fill" size={24} color="#CCC" />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DatePicker({ value, onChange }: { value: string | undefined, onChange: (v: string) => void }) {
  // Simple Year-Month-Day selector
  const now = new Date();
  const [year, setYear] = useState(value ? parseInt(value.split('-')[0]) : now.getFullYear());
  const [month, setMonth] = useState(value ? parseInt(value.split('-')[1]) : now.getMonth() + 1);
  const [day, setDay] = useState(value ? parseInt(value.split('-')[2]) : now.getDate());

  const years = Array.from({ length: 20 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const update = (y: number, m: number, d: number) => {
    setYear(y); setMonth(m); setDay(d);
    onChange(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  };

  return (
    <View style={{ flexDirection: 'row', height: 180 }}>
      <PickerColumn items={years} selected={year} onSelect={y => update(y, month, day)} label="年" />
      <PickerColumn items={months} selected={month} onSelect={m => update(year, m, day)} label="月" />
      <PickerColumn items={days} selected={day} onSelect={d => update(year, month, d)} label="日" />
    </View>
  );
}

function PickerColumn({ items, selected, onSelect, label }: { items: number[], selected: number, onSelect: (v: number) => void, label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ThemedText style={{ marginBottom: 8, color: '#999' }}>{label}</ThemedText>
      <ScrollView showsVerticalScrollIndicator={false}>
        {items.map(item => (
          <Pressable key={item} onPress={() => onSelect(item)} style={{ paddingVertical: 8, alignItems: 'center' }}>
             <ThemedText style={{ fontSize: 18, fontWeight: item === selected ? 'bold' : 'normal', color: item === selected ? Colors.light.tint : '#333' }}>
               {item}
             </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44 },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#FFF' },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#E0E0E0' },
  placeholderText: { color: '#999' },
  editButton: { position: 'absolute', right: 16, bottom: 16, backgroundColor: 'rgba(0,0,0,0.5)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  imageGrid: { width: '100%', backgroundColor: '#FFF', padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 200, position: 'relative' },
  gridThumb: { width: '30%', aspectRatio: 1, backgroundColor: '#F0F0F0', borderRadius: 8, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridRemove: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 2 },
  form: { marginTop: 20, backgroundColor: '#FFF', paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEE' },
  label: { fontSize: 16, color: '#333' },
  value: { fontSize: 16, color: '#333', textAlign: 'right' },
  saveButton: { margin: 24, backgroundColor: Colors.light.tint, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  chipSelected: { backgroundColor: Colors.light.tint },
  chipTextSelected: { color: '#FFF' },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 16 },
  pickerItemSelected: { backgroundColor: 'rgba(200, 141, 122, 0.1)' },
  pickerItemTextSelected: { color: Colors.light.tint, fontWeight: '600' },
  input: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, fontSize: 16 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
  optionRowSelected: { backgroundColor: 'rgba(200, 141, 122, 0.1)' },
  optionTextSelected: { color: Colors.light.tint, fontWeight: '600' },
  centerModal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  modalBtn: { paddingVertical: 16, alignItems: 'center' },
  separator: { height: 1, backgroundColor: '#EEE' },
});
