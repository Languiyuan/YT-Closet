import { Link } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">页面不存在</ThemedText>
      <ThemedText style={{ marginTop: 8 }}>未匹配到路由，请返回首页</ThemedText>
      <Link href="/(tabs)/stats" style={styles.link}>
        <ThemedText type="link">回到首页</ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background, padding: 24 },
  link: { marginTop: 16 },
});
