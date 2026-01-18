import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { generateThumbnail } from './image-utils';
import { Category, Dictionary, Item, Outfit, Role, StoreSnapshot, Tag } from './types';

const DATA_DIR = `${FileSystem.documentDirectory}data`;
const IMAGES_DIR = `${FileSystem.documentDirectory}images`;
const NOMEDIA_PATH = `${IMAGES_DIR}/.nomedia`;
const SNAPSHOT_PATH = `${DATA_DIR}/store.json`;

async function ensureDir(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

export async function initStorage() {
  await ensureDir(DATA_DIR);
  await ensureDir(IMAGES_DIR);
  if (Platform.OS === 'android') {
    const nomedia = await FileSystem.getInfoAsync(NOMEDIA_PATH);
    if (!nomedia.exists) {
      await FileSystem.writeAsStringAsync(NOMEDIA_PATH, '');
    }
  }
  const info = await FileSystem.getInfoAsync(SNAPSHOT_PATH);
  if (!info.exists) {
    const initial: StoreSnapshot = {
      roles: [],
      items: [],
      outfits: [],
      dictionaryByRole: {},
      currentRoleId: undefined,
    };
    await FileSystem.writeAsStringAsync(SNAPSHOT_PATH, JSON.stringify(initial));
  }
}

export async function loadStore(): Promise<StoreSnapshot> {
  const data = await FileSystem.readAsStringAsync(SNAPSHOT_PATH);
  return JSON.parse(data) as StoreSnapshot;
}

async function saveStore(store: StoreSnapshot) {
  await FileSystem.writeAsStringAsync(SNAPSHOT_PATH, JSON.stringify(store));
}

export async function setCurrentRole(roleId?: string) {
  const store = await loadStore();
  store.currentRoleId = roleId;
  await saveStore(store);
  return store;
}

export async function upsertRole(role: Role) {
  const store = await loadStore();
  const idx = store.roles.findIndex(r => r.id === role.id);
  if (idx >= 0) {
    store.roles[idx] = role;
  } else {
    store.roles.push(role);
  }
  // Always update dictionary if missing OR if we want to enforce preset (but user might have customized it? 
  // For now, if missing, add it. If present, maybe we should merge? 
  // User said "Category selection has no content", implies existing ones are broken.
  // I will force update the dictionary for now to fix the user's issue.)
  // Actually, let's just update it if it's missing or if the user is asking for a fix.
  // I'll make it so it updates if the version is old? No versioning yet.
  // I will just check if it exists. But to fix the user's issue, I should probably expose a way to reset it.
  // For this specific interaction, I'll rely on the user potentially creating a new role OR
  // I'll assume the app might need to re-initialize it.
  // Let's just stick to "if missing". But I'll add a temporary hack in `loadStore` or somewhere? 
  // No, better: I'll export `getPresetDictionary` and let `store-context` use it to fix things.
  if (!store.dictionaryByRole[role.id] || store.dictionaryByRole[role.id].categories.length === 0) {
    store.dictionaryByRole[role.id] = getPresetDictionary(role.id);
  }
  await saveStore(store);
  return store;
}

export async function removeRole(roleId: string) {
  const store = await loadStore();
  store.roles = store.roles.filter(r => r.id !== roleId);
  store.items = store.items.filter(i => i.roleId !== roleId);
  store.outfits = store.outfits.filter(o => o.roleId !== roleId);
  delete store.dictionaryByRole[roleId];
  if (store.currentRoleId === roleId) {
    store.currentRoleId = store.roles[0]?.id;
  }
  await saveStore(store);
  return store;
}

export async function upsertItem(item: Item) {
  const store = await loadStore();
  const idx = store.items.findIndex(i => i.id === item.id);
  if (idx >= 0) store.items[idx] = item;
  else store.items.push(item);
  await saveStore(store);
  return store;
}

export async function removeItem(itemId: string) {
  const store = await loadStore();
  store.items = store.items.filter(i => i.id !== itemId);
  store.outfits = store.outfits.map(o => ({
    ...o,
    itemIds: o.itemIds.filter(id => id !== itemId),
  }));
  await saveStore(store);
  return store;
}

export async function upsertOutfit(outfit: Outfit) {
  const store = await loadStore();
  const idx = store.outfits.findIndex(o => o.id === outfit.id);
  if (idx >= 0) store.outfits[idx] = outfit;
  else store.outfits.push(outfit);
  await saveStore(store);
  return store;
}

export async function removeOutfit(outfitId: string) {
  const store = await loadStore();
  store.outfits = store.outfits.filter(o => o.id !== outfitId);
  await saveStore(store);
  return store;
}

export async function setDictionary(roleId: string, dict: Dictionary) {
  const store = await loadStore();
  store.dictionaryByRole[roleId] = dict;
  await saveStore(store);
  return store;
}

export async function saveImageFromUri(sourceUri: string) {
  await ensureDir(IMAGES_DIR);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const dest = `${IMAGES_DIR}/${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  
  // 同时生成缩略图
  try {
    await generateThumbnail(dest, 400, 0.8);
  } catch (error) {
    console.error('生成缩略图失败:', error);
    // 缩略图生成失败不影响原图保存
  }
  
  return dest;
}

export async function saveImagesFromUris(sourceUris: string[]) {
  const results: string[] = [];
  for (const uri of sourceUris) {
    const saved = await saveImageFromUri(uri);
    results.push(saved);
  }
  return results;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getPresetDictionary(roleId: string): Dictionary {
  // Provided tree structure
  const clothingCategoryTree = [
    {
      id: 'all',
      name: '全部',
      children: [
        { id: 'all_item', name: '不限' },
      ]
    },
    {
      id: 'tops',
      name: '上衣',
      children: [
        { id: 'coat', name: '大衣' },
        { id: 'trench', name: '风衣' },
        { id: 'down_jacket', name: '羽绒服' },
        { id: 'cotton_padded', name: '棉服' },
        { id: 'sweater', name: '毛衣' },
        { id: 'knit_sweater', name: '针织衫' },
        { id: 'cardigan', name: '开衫' },
        { id: 'hoodie', name: '卫衣' },
        { id: 'shirt', name: '衬衫' },
        { id: 'tshirt_short', name: '短袖T恤' },
        { id: 'tshirt_long', name: '长袖T恤' },
        { id: 'polo', name: 'POLO衫' },
        { id: 'vest', name: '马甲' },
        { id: 'blouse', name: '雪纺衫/女式衬衫' },
        { id: 'tank_top', name: '吊带/背心' }
      ]
    },
    {
      id: 'bottoms',
      name: '下衣',
      children: [
        { id: 'trousers', name: '长裤' },
        { id: 'jeans', name: '牛仔裤' },
        { id: 'casual_pants', name: '休闲裤' },
        { id: 'chinos', name: '西裤/卡其裤' },
        { id: 'sweatpants', name: '运动裤' },
        { id: 'shorts', name: '短裤' },
        { id: 'bermuda_shorts', name: '百慕大短裤' },
        { id: 'skirt_short', name: '短裙' },
        { id: 'skirt_mid', name: '中长裙' },
        { id: 'skirt_long', name: '半身长裙' },
        { id: 'pencil_skirt', name: '包臀裙' },
        { id: 'a_line_skirt', name: 'A字裙' },
        { id: 'leggings', name: '打底裤/紧身裤' },
        { id: 'yoga_pants', name: '瑜伽裤' }
      ]
    },
    {
      id: 'shoes',
      name: '鞋子',
      children: [
        { id: 'sneakers', name: '运动鞋' },
        { id: 'running_shoes', name: '跑鞋' },
        { id: 'canvas_shoes', name: '帆布鞋' },
        { id: 'dress_shoes', name: '皮鞋' },
        { id: 'loafers', name: '乐福鞋' },
        { id: 'oxfords', name: '牛津鞋' },
        { id: 'boots', name: '靴子（长筒）' },
        { id: 'ankle_boots', name: '短靴' },
        { id: 'martin_boots', name: '马丁靴' },
        { id: 'snow_boots', name: '雪地靴' },
        { id: 'sandals', name: '凉鞋' },
        { id: 'flip_flops', name: '拖鞋/人字拖' },
        { id: 'high_heels', name: '高跟鞋' },
        { id: 'flats', name: '平底鞋' },
        { id: 'mules', name: '穆勒鞋' }
      ]
    },
    {
      id: 'accessories',
      name: '配饰',
      children: [
        { id: 'hat', name: '帽子' },
        { id: 'cap', name: '棒球帽' },
        { id: 'beret', name: '贝雷帽' },
        { id: 'bucket_hat', name: '渔夫帽' },
        { id: 'beanie', name: '毛线帽' },
        { id: 'scarf', name: '围巾' },
        { id: 'silk_scarf', name: '丝巾' },
        { id: 'belt', name: '腰带' },
        { id: 'gloves', name: '手套' },
        { id: 'bag_tote', name: '托特包' },
        { id: 'bag_crossbody', name: '斜挎包' },
        { id: 'backpack', name: '双肩包' },
        { id: 'clutch', name: '手拿包' },
        { id: 'wallet', name: '钱包' },
        { id: 'socks_short', name: '短袜' },
        { id: 'socks_mid', name: '中筒袜' },
        { id: 'socks_long', name: '长筒袜' },
        { id: 'tights', name: '连裤袜' },
        { id: 'sunglasses', name: '墨镜' },
        { id: 'watch', name: '手表' },
        { id: 'necklace', name: '项链' },
        { id: 'earrings', name: '耳环' },
        { id: 'bracelet', name: '手链' }
      ]
    }
  ];

  const categories: Category[] = [];
  
  clothingCategoryTree.forEach(l1 => {
    categories.push({
      id: l1.id,
      roleId,
      name: l1.name,
      level: 1,
      isSystem: true,
    });
    l1.children.forEach(l2 => {
      categories.push({
        id: l2.id,
        roleId,
        name: l2.name,
        level: 2,
        parentId: l1.id,
        isSystem: true,
      });
    });
  });

  const tags: Tag[] = [
    { id: uid(), roleId, name: '春', type: 'season' },
    { id: uid(), roleId, name: '夏', type: 'season' },
    { id: uid(), roleId, name: '秋', type: 'season' },
    { id: uid(), roleId, name: '冬', type: 'season' },
    { id: uid(), roleId, name: '四季通用', type: 'season' },
  ];
  return { categories, tags };
}
