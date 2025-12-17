import { useStore } from '@/src/store-context';
import { Item } from '@/src/types';
import { ThemedSafeAreaView } from '@/components/themed-safe-area-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { FlatList, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveImageFromUri } from '@/src/storage';
import { useState } from 'react';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ClosetScreen() {
  const { store, saveItem, deleteItem } = useStore();
  const roleId = store.currentRoleId;
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const saved = await saveImageFromUri(res.assets[0].uri);
      setImageUri(saved);
    }
  };

  const addItem = async () => {
    if (!roleId) return;
    const now = Date.now();
    const item: Item = {
      id: uuid(),
      roleId,
      name: name.trim() || undefined,
      imageUri,
      categoryId: 'uncategorized',
      color: color.trim() || undefined,
      tagIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveItem(item);
    setName('');
    setColor('');
    setImageUri(undefined);
  };

  const items = store.items.filter(i => i.roleId === roleId);

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ThemedText type="title">衣橱</ThemedText>
      {!roleId && <ThemedText>请先在“角色”标签选择当前角色</ThemedText>}
      {roleId && (
        <View style={styles.row}>
          <TextInput
            placeholder="名称"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="颜色"
            value={color}
            onChangeText={setColor}
            style={styles.input}
          />
          <Pressable style={styles.button} onPress={pickImage}>
            <ThemedText style={styles.buttonText}>图片</ThemedText>
          </Pressable>
          <Pressable style={styles.button} onPress={addItem}>
            <ThemedText style={styles.buttonText}>添加</ThemedText>
          </Pressable>
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.placeholder]} />
            )}
            <ThemedText type="defaultSemiBold">{item.name || '未命名'}</ThemedText>
            <View style={styles.cardRow}>
              <ThemedText>{item.color || '—'}</ThemedText>
              <Pressable onPress={() => deleteItem(item.id)}>
                <ThemedText style={styles.deleteText}>删除</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<ThemedText>暂无衣物</ThemedText>}
      />
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderColor: '#F2C078',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: { color: '#FFF' },
  card: {
    flex: 1,
    gap: 6,
    backgroundColor: '#FFF3E6',
    borderRadius: 12,
    padding: 10,
  },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  placeholder: { backgroundColor: '#F2C078' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  deleteText: { color: '#D9534F' },
});
