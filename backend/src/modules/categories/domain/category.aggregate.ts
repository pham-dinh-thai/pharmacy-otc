import { Id } from '../../../shared/domain/value-objects/id.value-object';
import {
  CategoryAlreadyDeletedException,
  CategoryNotDeletedException,
} from './exceptions/category.exceptions';
import { CategoryName } from './value-objects/category-name';
import { CategorySlug } from './value-objects/category-slug';

export type CategoryInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  productIds?: string[];
};

export type CreateCategoryProps = CategoryInput;
export type UpdateCategoryProps = CategoryInput;

export type FromPersistentCategoryProps = CategoryInput & {
  id: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Danh mục là aggregate độc lập. Quan hệ với sản phẩm là N-N và được sở hữu
 * ở phía danh mục: `productIds` là danh sách id sản phẩm đã chuẩn hoá, được
 * lưu tại bảng trung gian `product_categories`.
 */
export class Category {
  private constructor(
    private readonly id: Id,
    private name: CategoryName,
    private slug: CategorySlug,
    private description: string | null,
    private productIds: string[],
    private deletedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateCategoryProps): Category {
    const now = new Date();
    const name = CategoryName.create(props.name);

    return new Category(
      Id.generate(),
      name,
      Category.buildSlug(name, props.slug),
      props.description?.trim() || null,
      Category.normalizeProductIds(props.productIds),
      null,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentCategoryProps): Category {
    const name = CategoryName.create(props.name);

    return new Category(
      Id.create(props.id),
      name,
      Category.buildSlug(name, props.slug),
      props.description?.trim() || null,
      Category.normalizeProductIds(props.productIds),
      props.deletedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  public update(props: UpdateCategoryProps): void {
    const name = CategoryName.create(props.name);

    this.name = name;
    this.slug = Category.buildSlug(name, props.slug);
    this.description = props.description?.trim() || null;
    if (props.productIds !== undefined) {
      this.productIds = Category.normalizeProductIds(props.productIds);
    }
    this.updatedAt = new Date();
  }

  public setProductIds(productIds: string[]): void {
    this.productIds = Category.normalizeProductIds(productIds);
    this.updatedAt = new Date();
  }

  public softDelete(): void {
    if (this.isDeleted()) {
      throw new CategoryAlreadyDeletedException(this.getId());
    }

    const now = new Date();
    this.deletedAt = now;
    this.updatedAt = now;
  }

  public restore(): void {
    if (!this.isDeleted()) {
      throw new CategoryNotDeletedException(this.getId());
    }

    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getName(): string {
    return this.name.getValue();
  }

  public getSlug(): string {
    return this.slug.getValue();
  }

  public getDescription(): string | null {
    return this.description;
  }

  public getProductIds(): readonly string[] {
    return this.productIds;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  private static buildSlug(
    name: CategoryName,
    slug?: string | null,
  ): CategorySlug {
    return slug?.trim()
      ? CategorySlug.create(slug)
      : CategorySlug.fromName(name.getValue());
  }

  private static normalizeProductIds(productIds: string[] = []): string[] {
    return [
      ...new Set(
        productIds
          .filter((id) => id?.trim())
          .map((id) => Id.create(id).getValue()),
      ),
    ];
  }
}
