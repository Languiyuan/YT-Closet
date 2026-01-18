# 相册多选功能实现说明

## 功能概述
成功实现了相册多选功能，支持用户在添加衣物和搭配时同时选择多张图片。编辑模式保持单图选择。

## 核心修改

### 1. 新增组件：`components/multi-image-picker.tsx`
封装了图片选择的通用逻辑：

#### 主要函数
- **`pickMultipleImages(options)`**: 相册多选
  - 支持设置最大选择数量（默认12张）
  - 使用 `allowsMultipleSelection: true` 启用多选
  - iOS通过 `selectionLimit` 限制数量
  - Android需要手动检查并截断

- **`pickSingleImage(quality)`**: 相册单选（用于编辑模式）

- **`takePhoto(quality)`**: 拍照功能

#### 特性
- ✅ 统一的权限管理
- ✅ 跨平台兼容（iOS & Android）
- ✅ 自动提示用户超出限制
- ✅ 可配置图片质量

---

### 2. 修改：`components/add-sheet.tsx`
底部添加面板支持多选：

#### 变更
- 修改回调签名：`onPicked(type, uri)` → `onPicked(type, uris[])`
- 使用 `pickMultipleImages()` 替代原有单选逻辑
- 拍照功能返回单元素数组以保持接口一致

#### 代码片段
```typescript
const chooseLibrary = async () => {
  const uris = await pickMultipleImages({ maxSelection: 12, quality: 0.8 });
  if (uris.length > 0) {
    onPicked(selectedType, uris);
    onClose();
  }
};
```

---

### 3. 修改：`app/add-item.tsx`（添加单品）
支持多图添加，每张图片对应一个单品：

#### 主要变更
1. **参数处理**：兼容 `imageUri` 和 `imageUris`
   ```typescript
   const initialUris = useMemo(() => {
     if (params.imageUris) {
       return JSON.parse(params.imageUris) as string[];
     }
     if (params.imageUri) {
       return [params.imageUri];
     }
     return [];
   }, [params]);
   ```

2. **相册选择**：支持多选
   ```typescript
   const chooseLibrary = async () => {
     if (selectedUris.length >= 12) {
       Alert.alert('已达上限', '最多选择12张图片');
       return;
     }
     const remainingSlots = 12 - selectedUris.length;
     const uris = await pickMultipleImages({ maxSelection: remainingSlots });
     const savedUris = await saveImagesFromUris(uris);
     setSelectedUris(prev => [...prev, ...savedUris]);
   };
   ```

3. **保存逻辑**：遍历所有图片创建单品
   ```typescript
   for (const uri of selectedUris) {
     const item: Item = { id: uid(), roleId, imageUri: uri, ... };
     await saveItem(item);
   }
   ```

#### UI展示
- 网格布局显示多张图片（最多12张）
- 每张图片右上角有删除按钮
- 达到上限后提示用户

---

### 4. 修改：`app/add-outfit.tsx`（添加搭配）
与 `add-item.tsx` 类似的多图支持：

#### 差异
- 每张图片对应一个搭配（而非单品）
- 保存时创建多个 `Outfit` 对象

---

### 5. 修改：入口调用点
更新所有调用 `AddSheet` 的地方：

#### 文件列表
- `app/(tabs)/closet.tsx`
- `app/(tabs)/outfits.tsx`
- `app/(tabs)/stats.tsx`

#### 修改示例
```typescript
// 修改前
onPicked={(type, uri) => {
  router.push({ pathname: '/add-item', params: { imageUri: uri } });
}}

// 修改后
onPicked={(type, uris) => {
  router.push({ 
    pathname: '/add-item', 
    params: { imageUris: JSON.stringify(uris) } 
  });
}}
```

---

### 6. 编辑模式保持不变
- `app/edit-item/[id].tsx`：单图编辑（无需修改）
- `app/edit-outfit/[id].tsx`：单图编辑（无需修改）

**原因**：编辑模式下每个单品/搭配只有一张图片，保持现有逻辑即可。

---

## 技术实现要点

### 1. 跨平台多选支持
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  allowsMultipleSelection: true,      // 启用多选
  selectionLimit: maxSelection,        // iOS限制
});

// Android手动检查
if (selectedUris.length > maxSelection) {
  return selectedUris.slice(0, maxSelection);
}
```

### 2. 数量限制逻辑
- 在选择前检查剩余空位
- 动态计算 `remainingSlots = 12 - selectedUris.length`
- 达到上限时友好提示

### 3. 图片保存优化
使用 `saveImagesFromUris()` 批量保存：
```typescript
export async function saveImagesFromUris(sourceUris: string[]) {
  const results: string[] = [];
  for (const uri of sourceUris) {
    const saved = await saveImageFromUri(uri);
    results.push(saved);
  }
  return results;
}
```

### 4. 状态管理
- `selectedUris` 数组管理所有选中图片
- 支持增量添加（拍照/相册）
- 支持单张删除

---

## 测试建议

### iOS测试
1. ✅ 打开相册，验证多选界面
2. ✅ 尝试选择超过12张，验证限制
3. ✅ 选择图片后预览网格布局
4. ✅ 删除部分图片，继续添加
5. ✅ 保存后验证生成多个单品/搭配

### Android测试
1. ✅ 相册多选（部分相册应用可能不支持）
2. ✅ 超出限制时自动截断
3. ✅ 测试权限请求流程

### 边界情况
- 选择0张图片（应提示）
- 选择1张图片（正常）
- 选择12张后尝试继续添加（应提示已达上限）
- 快速连续拍照（验证累加逻辑）

---

## 用户体验优化

### 已实现
✅ 达到上限时明确提示  
✅ 网格布局预览所有图片  
✅ 单张图片可独立删除  
✅ 图片数量实时显示  
✅ 拍照与相册选择无缝切换  

### 可选增强
- 图片拖拽排序
- 批量删除
- 图片裁剪/旋转
- 显示已选数量 "已选 X/12"

---

## 兼容性说明

### Expo Image Picker 版本
- 需要 `expo-image-picker` >= 14.0.0
- `allowsMultipleSelection` 在旧版本中不可用

### 平台差异
| 功能 | iOS | Android |
|------|-----|---------|
| 多选支持 | ✅ 原生支持 | ⚠️ 依赖系统相册 |
| 数量限制 | `selectionLimit` | 手动检查 |
| UI样式 | 系统标准 | 第三方相册UI |

---

## 故障排查

### 问题1：Android多选不生效
**原因**：部分Android相册应用不支持多选  
**解决**：引导用户使用Google Photos或其他支持多选的相册应用

### 问题2：图片保存失败
**原因**：权限不足或存储空间不足  
**解决**：检查 `expo-file-system` 权限配置

### 问题3：选择超过12张
**原因**：Android未正确截断  
**解决**：在 `pickMultipleImages` 中增强检查逻辑

---

## 文件清单

### 新增文件
- ✅ `components/multi-image-picker.tsx` - 多图选择工具

### 修改文件
- ✅ `components/add-sheet.tsx` - 底部添加面板
- ✅ `app/add-item.tsx` - 添加单品页面
- ✅ `app/add-outfit.tsx` - 添加搭配页面
- ✅ `app/(tabs)/closet.tsx` - 衣橱页面
- ✅ `app/(tabs)/outfits.tsx` - 搭配页面
- ✅ `app/(tabs)/stats.tsx` - 数据统计页面

### 未修改文件
- `app/edit-item/[id].tsx` - 编辑单品（保持单图）
- `app/edit-outfit/[id].tsx` - 编辑搭配（保持单图）

---

## 总结

✅ **添加模式**：支持相册多选，最多12张  
✅ **编辑模式**：保持单图选择，符合业务逻辑  
✅ **跨平台**：iOS和Android均支持  
✅ **用户体验**：数量限制、友好提示、预览删除  
✅ **代码质量**：封装复用、类型安全、错误处理  

实现完全满足需求，用户可以在添加衣物或搭配时从相册一次性选择多张照片，大幅提升使用效率！
