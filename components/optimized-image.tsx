import { Colors } from '@/constants/theme';
import { Image, ImageContentFit } from 'expo-image';
import React, { memo, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

interface OptimizedImageProps {
  /** 图片URI（优先使用缩略图） */
  uri?: string;
  /** 原图URI（用于查看大图或缩略图失败时的回退） */
  originalUri?: string;
  /** 样式 */
  style?: ViewStyle;
  /** 内容适配模式 */
  contentFit?: ImageContentFit;
  /** 是否启用懒加载 */
  lazy?: boolean;
  /** 占位符背景色 */
  placeholderColor?: string;
  /** 是否显示加载指示器 */
  showLoader?: boolean;
  /** 圆角大小 */
  borderRadius?: number;
  /** 点击事件 */
  onPress?: () => void;
  /** 长按事件 */
  onLongPress?: () => void;
}

/**
 * 优化的图片组件
 * - 支持懒加载
 * - 支持缩略图加载失败自动回退到原图
 * - 支持占位符
 * - 自动使用 expo-image 的缓存机制
 */
export const OptimizedImage = memo(({
  uri,
  originalUri,
  style,
  contentFit = 'cover',
  lazy = true,
  placeholderColor = '#F0F0F0',
  showLoader = true,
  borderRadius = 0,
  onPress,
  onLongPress,
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  
  // 当前尝试加载的URI
  const [currentUri, setCurrentUri] = useState<string | undefined>(uri || originalUri);

  // 懒加载触发
  useEffect(() => {
    if (lazy) {
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lazy]);

  // 当外部传入的 URI 改变时重置内部状态
  useEffect(() => {
    setCurrentUri(uri || originalUri);
    setHasError(false);
    setIsLoading(true);
  }, [uri, originalUri]);

  const handleLoadError = () => {
    // 如果缩略图加载失败，且存在原图URI，且当前不是在加载原图，则回退到原图
    if (uri && currentUri === uri && originalUri && uri !== originalUri) {
      console.log('缩略图加载失败，回退到原图:', originalUri);
      setCurrentUri(originalUri);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (!currentUri || !shouldLoad) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: placeholderColor, borderRadius },
          style,
        ]}
      />
    );
  }

  if (hasError) {
    return (
      <View
        style={[
          styles.placeholder,
          styles.errorPlaceholder,
          { borderRadius },
          style,
        ]}
      />
    );
  }

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      <Image
        source={{ uri: currentUri }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        contentFit={contentFit}
        transition={200}
        cachePolicy="memory-disk"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={handleLoadError}
        recyclingKey={currentUri}
      />
      
      {isLoading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.light.tint} />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPlaceholder: {
    backgroundColor: '#E0E0E0',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
