export type Role = {
  id: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type RolePage = {
  items: Role[];
  total: number;
  page: number;
  limit: number;
};
