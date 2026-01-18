import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const THUMBNAILS_DIR = `${FileSystem.documentDirectory}thumbnails`;

/**
 * 确保缩略图目录存在
 */
async function ensureThumbnailsDir() {
  const info = await FileSystem.getInfoAsync(THUMBNAILS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(THUMBNAILS_DIR, { intermediates: true });
  }
}

/**
 * 生成图片缩略图
 * @param sourceUri 原图URI
 * @param maxWidth 最大宽度（默认400px，适合列表展示）
 * @param quality 压缩质量（0-1，默认0.8）
 * @returns 缩略图URI
 */
export async function generateThumbnail(
  sourceUri: string,
  maxWidth: number = 400,
  quality: number = 0.8
): Promise<string> {
  try {
    await ensureThumbnailsDir();

    // 从源路径提取文件名
    const sourceFilename = sourceUri.split('/').pop();
    if (!sourceFilename) throw new Error('无法提取文件名');

    // 使用 expo-image-manipulator 压缩和调整大小
    const result = await manipulateAsync(
      sourceUri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: SaveFormat.JPEG }
    );

    // 缩略图路径：使用 thumb_ + 原文件名
    const thumbnailPath = `${THUMBNAILS_DIR}/thumb_${sourceFilename}`;

    // 检查是否已存在同名缩略图，存在则先删除
    const check = await FileSystem.getInfoAsync(thumbnailPath);
    if (check.exists) {
      await FileSystem.deleteAsync(thumbnailPath);
    }

    // 移动到缩略图目录
    await FileSystem.moveAsync({
      from: result.uri,
      to: thumbnailPath,
    });

    console.log('缩略图已生成:', thumbnailPath);
    return thumbnailPath;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    return sourceUri;
  }
}

/**
 * 批量生成缩略图
 * @param sourceUris 原图URI数组
 * @param maxWidth 最大宽度
 * @param quality 压缩质量
 * @returns 缩略图URI数组
 */
export async function generateThumbnails(
  sourceUris: string[],
  maxWidth: number = 400,
  quality: number = 0.8
): Promise<string[]> {
  const results: string[] = [];
  
  for (const uri of sourceUris) {
    const thumbnail = await generateThumbnail(uri, maxWidth, quality);
    results.push(thumbnail);
  }
  
  return results;
}

/**
 * 从原图URI生成缩略图URI（用于已保存的图片）
 * @param originalUri 原图URI
 * @returns 缩略图URI，如果不存在则返回原图URI
 */
export function getThumbnailUri(originalUri: string): string {
  if (!originalUri) return '';
  
  // 如果已经是缩略图，直接返回
  if (originalUri.includes('/thumbnails/')) {
    return originalUri;
  }
  
  // 构建缩略图路径（假设存在）
  const filename = originalUri.split('/').pop();
  if (!filename) return originalUri;
  
  const thumbnailPath = `${THUMBNAILS_DIR}/thumb_${filename}`;
  return thumbnailPath;
}

/**
 * 检查缩略图是否存在，不存在则生成
 * @param originalUri 原图URI
 * @returns 缩略图URI
 */
export async function ensureThumbnail(originalUri: string): Promise<string> {
  if (!originalUri) return '';
  
  // 如果已经是缩略图，直接返回
  if (originalUri.includes('/thumbnails/')) {
    return originalUri;
  }
  
  const thumbnailUri = getThumbnailUri(originalUri);
  const info = await FileSystem.getInfoAsync(thumbnailUri);
  
  if (info.exists) {
    return thumbnailUri;
  }
  
  // 缩略图不存在，生成新的
  return await generateThumbnail(originalUri);
}

/**
 * 清理指定图片的缩略图
 * @param originalUri 原图URI
 */
export async function deleteThumbnail(originalUri: string): Promise<void> {
  const thumbnailUri = getThumbnailUri(originalUri);
  
  try {
    const info = await FileSystem.getInfoAsync(thumbnailUri);
    if (info.exists) {
      await FileSystem.deleteAsync(thumbnailUri);
    }
  } catch (error) {
    console.error('删除缩略图失败:', error);
  }
}

/**
 * 获取可靠的显示URI（如果缩略图存在则使用缩略图，否则使用原图）
 */
export async function getReliableImageUri(originalUri: string): Promise<string> {
  if (!originalUri) return '';
  
  const thumbnailUri = getThumbnailUri(originalUri);
  if (thumbnailUri === originalUri) return originalUri;

  try {
    const info = await FileSystem.getInfoAsync(thumbnailUri);
    return info.exists ? thumbnailUri : originalUri;
  } catch {
    return originalUri;
  }
}
