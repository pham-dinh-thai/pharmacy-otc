export type Department = {
  id: string;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentPage = {
  items: Department[];
  total: number;
  page: number;
  limit: number;
};
