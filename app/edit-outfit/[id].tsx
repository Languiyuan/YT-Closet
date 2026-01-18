import { ThemedSafeAreaView } from '@/components/themed-safe-area-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { SEASONS } from '@/src/constants';
import { saveImageFromUri } from '@/src/storage';
import { useStore } from '@/src/store-context';
import { Outfit } from '@/src/types';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function EditOutfitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { store, saveOutfit, deleteOutfit } = useStore();
  const router = useRouter();
  
  const outfit = store.outfits.find(o => o.id === id);
  const roleId = outfit?.roleId || store.currentRoleId;

  // Form State
  const [imageUri, setImageUri] = useState<string | undefined>(outfit?.previewUri);
  const [seasonTags, setSeasonTags] = useState<string[]>(outfit?.season || []);
  
  // Modals
  const [activeModal, setActiveModal] = useState<'season' | null>(null);
  const [imagePickOpen, setImagePickOpen] = useState(false);

  if (!outfit) {
    return (
      <ThemedSafeAreaView style={styles.container}>
        <ThemedText>未找到该搭配</ThemedText>
        <Pressable onPress={() => router.back()}><ThemedText>返回</ThemedText></Pressable>
      </ThemedSafeAreaView>
    );
  }

  // Image Handling
  const chooseLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const saved = await saveImageFromUri(res.assets[0].uri);
      setImageUri(saved);
    }
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const saved = await saveImageFromUri(res.assets[0].uri);
      setImageUri(saved);
    }
  };
  const handleEditImage = () => {
    setImagePickOpen(true);
  };

  const save = async () => {
    if (!roleId) return;
    const now = Date.now();
    
    const next: Outfit = {
      ...outfit,
      previewUri: imageUri,
      season: seasonTags,
      updatedAt: now,
    };
    await saveOutfit(next);
    router.back();
  };

  const remove = async () => {
      await deleteOutfit(outfit.id);
      router.back();
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

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
          <Pressable style={styles.editButton} onPress={handleEditImage}>
            <IconSymbol name="pencil" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {renderRow('季节', seasonTags.length > 0 ? seasonTags.join('、') : undefined, () => setActiveModal('season'))}
        </View>
        
        <Pressable style={styles.saveButton} onPress={save}>
          <ThemedText style={styles.saveButtonText}>保存</ThemedText>
        </Pressable>
        
        <Pressable style={[styles.saveButton, { backgroundColor: '#FF3B30', marginTop: 0 }]} onPress={remove}>
          <ThemedText style={styles.saveButtonText}>删除</ThemedText>
        </Pressable>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#FFF' },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#E0E0E0' },
  placeholderText: { color: '#999' },
  editButton: { position: 'absolute', right: 16, bottom: 16, backgroundColor: 'rgba(0,0,0,0.5)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
  centerModal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  modalBtn: { paddingVertical: 16, alignItems: 'center' },
  separator: { height: 1, backgroundColor: '#EEE' },
});
