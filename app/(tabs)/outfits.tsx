import { useStore } from '@/src/store-context';
import { Outfit } from '@/src/types';
import { ThemedSafeAreaView } from '@/components/themed-safe-area-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { FlatList, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generatePreview(itemUris: string[]) {
  return itemUris[0];
}

export default function OutfitsScreen() {
  const { store, saveOutfit, deleteOutfit } = useStore();
  const roleId = store.currentRoleId;
  const items = store.items.filter(i => i.roleId === roleId);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setSelected(s => ({ ...s, [id]: !s[id] }));
  };

  const addOutfit = async () => {
    if (!roleId) return;
    const ids = Object.keys(selected).filter(k => selected[k]);
    const now = Date.now();
    const uris = items.filter(i => ids.includes(i.id)).map(i => i.imageUri || '');
    const previewUri = generatePreview(uris);
    const outfit: Outfit = {
      id: uuid(),
      roleId,
      title: title.trim() || undefined,
      itemIds: ids,
      previewUri,
      createdAt: now,
      updatedAt: now,
    };
    await saveOutfit(outfit);
    setTitle('');
    setSelected({});
  };

  const outfits = store.outfits.filter(o => o.roleId === roleId);

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ThemedText type="title">搭配</ThemedText>
      {!roleId && <ThemedText>请先在“角色”标签选择当前角色</ThemedText>}
      {roleId && (
        <>
          <View style={styles.row}>
            <TextInput
              placeholder="标题"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <Pressable style={styles.button} onPress={addOutfit}>
              <ThemedText style={styles.buttonText}>保存</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="subtitle">选择衣物</ThemedText>
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            numColumns={3}
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => toggle(item.id)} style={styles.pickCard}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.pickThumb} />
                ) : (
                  <View style={[styles.pickThumb, styles.placeholder]} />
                )}
                <View
                  style={[
                    styles.pickOverlay,
                    selected[item.id] && { backgroundColor: 'rgba(217,123,102,0.35)' },
                  ]}
                />
              </Pressable>
            )}
          />
        </>
      )}
      <ThemedText type="subtitle">已保存</ThemedText>
      <FlatList
        data={outfits}
        keyExtractor={o => o.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.previewUri ? (
              <Image source={{ uri: item.previewUri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.placeholder]} />
            )}
            <View style={styles.cardRow}>
              <ThemedText type="defaultSemiBold">{item.title || '搭配'}</ThemedText>
              <Pressable onPress={() => deleteOutfit(item.id)}>
                <ThemedText style={styles.deleteText}>删除</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<ThemedText>暂无搭配</ThemedText>}
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
  pickCard: { position: 'relative', flex: 1 },
  pickThumb: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  pickOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  placeholder: { backgroundColor: '#F2C078' },
  card: {
    gap: 6,
    backgroundColor: '#FFF3E6',
    borderRadius: 12,
    padding: 10,
  },
  thumb: { width: '100%', aspectRatio: 2, borderRadius: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  deleteText: { color: '#D9534F' },
});
