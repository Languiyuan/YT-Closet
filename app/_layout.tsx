import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { StoreProvider } from '@/src/store-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <StoreProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-item" options={{ title: '添加单品', headerBackTitle: '返回' }} />
            <Stack.Screen name="add-outfit" options={{ title: '添加搭配', headerBackTitle: '返回' }} />
            <Stack.Screen name="edit-item/[id]" options={{ title: '编辑', headerBackTitle: '返回' }} />
            <Stack.Screen name="edit-outfit/[id]" options={{ title: '编辑', headerBackTitle: '返回' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </StoreProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
