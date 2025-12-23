import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export function FAB({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable style={styles.button} onPress={onPress}>
        <ThemedText style={styles.plus}>＋</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  plus: { color: '#FFF', fontSize: 28, lineHeight: 28 },
});
