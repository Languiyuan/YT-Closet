import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface MultiImagePickerOptions {
  maxSelection?: number;
  quality?: number;
}

/**
 * 打开相册多选图片
 * @param options 配置选项
 * @returns 返回选中的图片URI数组
 */
export async function pickMultipleImages(
  options: MultiImagePickerOptions = {}
): Promise<string[]> {
  const { maxSelection = 12, quality = 0.8 } = options;

  // 请求相册权限
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('需要权限', '需要相册权限以选择图片');
    return [];
  }

  // 启动相册选择器（多选模式）
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality,
    allowsMultipleSelection: true, // 关键：启用多选
    selectionLimit: maxSelection, // iOS限制选择数量
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  // 提取所有选中的图片URI
  const selectedUris = result.assets.map(asset => asset.uri);

  // Android需要手动检查数量限制
  if (selectedUris.length > maxSelection) {
    Alert.alert('超出限制', `最多只能选择${maxSelection}张图片`);
    return selectedUris.slice(0, maxSelection);
  }

  return selectedUris;
}

/**
 * 打开相册单选图片
 * @param quality 图片质量
 * @returns 返回选中的图片URI，未选择则返回null
 */
export async function pickSingleImage(quality: number = 0.8): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('需要权限', '需要相册权限以选择图片');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality,
    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * 拍照
 * @param quality 图片质量
 * @returns 返回拍摄的图片URI，取消则返回null
 */
export async function takePhoto(quality: number = 0.8): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('需要权限', '需要相机权限以拍摄图片');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}
