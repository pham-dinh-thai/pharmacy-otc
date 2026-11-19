import type { TriStateFilter } from '../../../shared/utils/list-filters';
import { Category } from './category.aggregate';

export type FindCategoriesFilters = {
  search?: string;
  deleted?: TriStateFilter;
  limit?: number;
  offset?: number;
};

export type CategoryPage = {
  items: Category[];
  total: number;
};

export interface ICategoriesRepository {
  findPage(filters?: FindCategoriesFilters): Promise<CategoryPage>;

  /** Chi tiết thường bỏ qua danh mục đã xoá mềm. */
  findById(id: string): Promise<Category | null>;

  /** Dùng cho xoá/khôi phục để biết trạng thái xoá mềm hiện tại. */
  findByIdIncludingDeleted(id: string): Promise<Category | null>;

  /** Kiểm tra trùng tên hoặc slug, có thể loại trừ một id khi cập nhật. */
  existsByNameOrSlug(
    name: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean>;

  /** Id sản phẩm thuộc danh mục, dùng để đồng bộ bảng trung gian. */
  findProductIds(categoryId: string): Promise<string[]>;

  /** Danh mục còn hoạt động, dùng để validate khi gắn vào sản phẩm. */
  findActiveByIds(ids: string[]): Promise<string[]>;

  create(category: Category): Promise<Category>;

  update(category: Category): Promise<Category>;
}

export const CATEGORIES_REPOSITORY = 'ICategoriesRepository';
