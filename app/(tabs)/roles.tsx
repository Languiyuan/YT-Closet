import { useStore } from '@/src/store-context';
import { Role } from '@/src/types';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useState } from 'react';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function RolesScreen() {
  const { store, saveRole, deleteRole, setRole } = useStore();
  const [name, setName] = useState('');

  const addRole = async () => {
    if (!name.trim()) return;
    const now = Date.now();
    const role: Role = { id: uuid(), name: name.trim(), createdAt: now, updatedAt: now };
    await saveRole(role);
    await setRole(role.id);
    setName('');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">角色</ThemedText>
      <View style={styles.row}>
        <TextInput
          placeholder="角色名称"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Pressable style={styles.button} onPress={addRole}>
          <ThemedText style={styles.buttonText}>添加</ThemedText>
        </Pressable>
      </View>
      <FlatList
        data={store.roles}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable onPress={() => setRole(item.id)} style={styles.itemLeft}>
              <ThemedText type="defaultSemiBold">
                {item.name}
                {store.currentRoleId === item.id ? ' • 当前' : ''}
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => deleteRole(item.id)} style={styles.delete}>
              <ThemedText style={styles.deleteText}>删除</ThemedText>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<ThemedText>暂无角色</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8 },
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
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  buttonText: { color: '#FFF' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF3E6',
  },
  itemLeft: { flex: 1 },
  delete: { paddingHorizontal: 8, paddingVertical: 6 },
  deleteText: { color: '#D9534F' },
});
