import React, { createContext, useContext, useEffect, useState } from 'react';
import { StoreSnapshot, Role, Item, Outfit, Dictionary } from './types';
import {
  initStorage,
  loadStore,
  setCurrentRole,
  upsertRole,
  removeRole,
  upsertItem,
  removeItem,
  upsertOutfit,
  removeOutfit,
  setDictionary,
} from './storage';

type StoreApi = {
  store: StoreSnapshot;
  refresh: () => Promise<void>;
  setRole: (roleId?: string) => Promise<void>;
  saveRole: (role: Role) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  saveItem: (item: Item) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  saveOutfit: (outfit: Outfit) => Promise<void>;
  deleteOutfit: (outfitId: string) => Promise<void>;
  saveDictionary: (roleId: string, dict: Dictionary) => Promise<void>;
};

const Ctx = createContext<StoreApi | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<StoreSnapshot>({
    roles: [],
    items: [],
    outfits: [],
    dictionaryByRole: {},
    currentRoleId: undefined,
  });

  useEffect(() => {
    (async () => {
      await initStorage();
      const s = await loadStore();
      setStore(s);
    })();
  }, []);

  const refresh = async () => setStore(await loadStore());

  const api: StoreApi = {
    store,
    refresh,
    setRole: async roleId => {
      setStore(await setCurrentRole(roleId));
    },
    saveRole: async role => {
      setStore(await upsertRole(role));
    },
    deleteRole: async roleId => {
      setStore(await removeRole(roleId));
    },
    saveItem: async item => {
      setStore(await upsertItem(item));
    },
    deleteItem: async itemId => {
      setStore(await removeItem(itemId));
    },
    saveOutfit: async outfit => {
      setStore(await upsertOutfit(outfit));
    },
    deleteOutfit: async outfitId => {
      setStore(await removeOutfit(outfitId));
    },
    saveDictionary: async (roleId, dict) => {
      setStore(await setDictionary(roleId, dict));
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const api = useContext(Ctx);
  if (!api) throw new Error('StoreProvider missing');
  return api;
}
