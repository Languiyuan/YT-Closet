/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Premium Soft Purple
const tintColorLight = '#00A878'; 
const tintColorDark = '#A29BFE';

export const Colors = {
  light: {
    text: '#2D2D2D', // Softer black
    background: '#FAFAFA', // Clean off-white
    card: '#FFFFFF',
    tint: tintColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#C7C7CC',
    tabIconSelected: tintColorLight,
    border: '#EFEFEF',
  },
  dark: {
    text: '#E3D0C5',
    background: '#1C1C1E',
    card: '#2C2C2E',
    tint: tintColorDark,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
    border: '#38383A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
