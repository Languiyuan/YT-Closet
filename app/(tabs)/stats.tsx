import { useStore } from '@/src/store-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

export default function StatsScreen() {
  const { store } = useStore();
  const roleId = store.currentRoleId;
  const items = store.items.filter(i => i.roleId === roleId);
  const outfits = store.outfits.filter(o => o.roleId === roleId);

  const byCategory: Record<string, number> = {};
  for (const it of items) {
    byCategory[it.categoryId] = (byCategory[it.categoryId] || 0) + 1;
  }
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">统计</ThemedText>
      {!roleId && <ThemedText>请先在“角色”标签选择当前角色</ThemedText>}
      {roleId && (
        <View style={styles.grid}>
          <View style={styles.card}>
            <ThemedText type="subtitle">衣物</ThemedText>
            <ThemedText type="defaultSemiBold">{items.length}</ThemedText>
          </View>
          <View style={styles.card}>
            <ThemedText type="subtitle">搭配</ThemedText>
            <ThemedText type="defaultSemiBold">{outfits.length}</ThemedText>
          </View>
          <View style={styles.card}>
            <ThemedText type="subtitle">最高类别</ThemedText>
            <ThemedText type="defaultSemiBold">{topCategory}</ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  grid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  card: {
    flexBasis: '48%',
    backgroundColor: '#FFF3E6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
});
