export type Role = {
  id: string;
  name: string;
  avatarUri?: string;
  createdAt: number;
  updatedAt: number;
};

export type Category = {
  id: string;
  roleId: string;
  name: string;
  parentId?: string;
  level?: 1 | 2;
  isSystem?: boolean;
  isHidden?: boolean;
};

export type Tag = {
  id: string;
  roleId: string;
  name: string;
  type?: 'season' | 'custom';
  isHidden?: boolean;
};

export type Item = {
  id: string;
  roleId: string;
  name?: string;
  imageUri?: string;
  categoryL1Id: string;
  categoryL2Id?: string;
  color?: string;
  brand?: string;
  size?: string;
  material?: string;
  storageLocation?: string;
  purchaseDate?: string;
  usageFrequency?: '高' | '中' | '低' | '弃用';
  palette?: '暖色' | '冷色' | '深色' | '浅色' | '中性';
  notes?: string;
  tagIds: string[];
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
};

export type Outfit = {
  id: string;
  roleId: string;
  title?: string;
  previewUri?: string;
  itemIds: string[];
  notes?: string;
  favorite?: boolean;
  retired?: boolean;
  season?: string[];
  createdAt: number;
  updatedAt: number;
};

export type Dictionary = {
  categories: Category[];
  tags: Tag[];
};

export type StoreSnapshot = {
  roles: Role[];
  items: Item[];
  outfits: Outfit[];
  dictionaryByRole: Record<string, Dictionary>;
  currentRoleId?: string;
};
