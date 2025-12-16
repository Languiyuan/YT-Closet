import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { StoreSnapshot, Role, Item, Outfit, Dictionary } from './types';

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
  if (!store.dictionaryByRole[role.id]) {
    store.dictionaryByRole[role.id] = { categories: [], tags: [] };
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
  return dest;
}
