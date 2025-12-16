import { useStore } from '@/src/store-context';
import { Dictionary } from '@/src/types';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SettingsScreen() {
  const { store, saveDictionary } = useStore();
  const roleId = store.currentRoleId;
  const dict = useMemo<Dictionary>(() => {
    if (!roleId) return { categories: [], tags: [] };
    return store.dictionaryByRole[roleId] ?? { categories: [], tags: [] };
  }, [store, roleId]);

  const [catName, setCatName] = useState('');
  const [tagName, setTagName] = useState('');

  const addCat = async () => {
    if (!roleId || !catName.trim()) return;
    const next = { ...dict, categories: [...dict.categories, { id: uuid(), roleId, name: catName.trim() }] };
    await saveDictionary(roleId, next);
    setCatName('');
  };

  const addTag = async () => {
    if (!roleId || !tagName.trim()) return;
    const next = { ...dict, tags: [...dict.tags, { id: uuid(), roleId, name: tagName.trim(), type: 'custom' }] };
    await saveDictionary(roleId, next);
    setTagName('');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">设置</ThemedText>
      {!roleId && <ThemedText>请先在“角色”标签选择当前角色</ThemedText>}
      {roleId && (
        <>
          <ThemedText type="subtitle">类别</ThemedText>
          <View style={styles.row}>
            <TextInput placeholder="新增类别" value={catName} onChangeText={setCatName} style={styles.input} />
            <Pressable style={styles.button} onPress={addCat}>
              <ThemedText style={styles.buttonText}>添加</ThemedText>
            </Pressable>
          </View>
          <FlatList
            data={dict.categories}
            keyExtractor={c => c.id}
            renderItem={({ item }) => <View style={styles.item}><ThemedText>{item.name}</ThemedText></View>}
            ListEmptyComponent={<ThemedText>暂无类别</ThemedText>}
          />
          <ThemedText type="subtitle">标签</ThemedText>
          <View style={styles.row}>
            <TextInput placeholder="新增标签" value={tagName} onChangeText={setTagName} style={styles.input} />
            <Pressable style={styles.button} onPress={addTag}>
              <ThemedText style={styles.buttonText}>添加</ThemedText>
            </Pressable>
          </View>
          <FlatList
            data={dict.tags}
            keyExtractor={t => t.id}
            renderItem={({ item }) => <View style={styles.item}><ThemedText>{item.name}</ThemedText></View>}
            ListEmptyComponent={<ThemedText>暂无标签</ThemedText>}
          />
        </>
      )}
    </ThemedView>
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
  item: { padding: 12, backgroundColor: '#FFF3E6', borderRadius: 12, marginBottom: 8 },
});
