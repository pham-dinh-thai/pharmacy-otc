export type Role = {
  id: string;
  name: string;
  permissions: string[];
  revokedPermissions: string[];
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};
