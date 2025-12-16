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
  categoryId: string;
  color?: string;
  brand?: string;
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
