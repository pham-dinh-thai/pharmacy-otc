import { Id } from '../../../shared/value-objects/id.value-object';
import {
  InvalidProductExpiryDateException,
  ProductAlreadyDeletedException,
  ProductNotDeletedException,
} from './exceptions/product.exceptions';
import { UnitPrice } from './value-objects/unit-price.object-value';

export const PRODUCT_SKU_MAX_LENGTH = 100;
export const PRODUCT_UNIT_MAX_LENGTH = 50;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 1000;
export const PRODUCT_IMAGE_URL_MAX_LENGTH = 2048;
export const PRODUCT_WARNING_MAX_LENGTH = 1000;

/** Chuẩn hoá SKU để kiểm tra trùng ở tầng ứng dụng khớp với aggregate. */
export function normalizeProductSku(sku?: string | null): string | null {
  const normalized = sku?.trim().toUpperCase();

  return normalized ? normalized.slice(0, PRODUCT_SKU_MAX_LENGTH) : null;
}

export type ProductInput = {
  name: string;
  unitPrice: string;
  sku?: string | null;
  unit?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  expiryDate?: string | null;
  warning?: string | null;
  categoryIds?: string[];
};

export type CreateProductProps = ProductInput;
export type UpdateProductProps = ProductInput;

export type FromPersistentProductProps = ProductInput & {
  id: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Product {
  private constructor(
    private readonly id: Id,
    private name: string,
    private unitPrice: UnitPrice,
    private sku: string | null,
    private unit: string | null,
    private description: string | null,
    private imageUrl: string | null,
    private expiryDate: string | null,
    private warning: string | null,
    private categoryIds: string[],
    private deletedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateProductProps): Product {
    const now = new Date();

    return new Product(
      Id.generate(),
      props.name,
      UnitPrice.create(props.unitPrice),
      Product.normalizeSku(props.sku),
      Product.normalizeText(props.unit, PRODUCT_UNIT_MAX_LENGTH),
      Product.normalizeText(props.description, PRODUCT_DESCRIPTION_MAX_LENGTH),
      Product.normalizeText(props.imageUrl, PRODUCT_IMAGE_URL_MAX_LENGTH),
      Product.normalizeExpiryDate(props.expiryDate),
      Product.normalizeText(props.warning, PRODUCT_WARNING_MAX_LENGTH),
      Product.normalizeCategoryIds(props.categoryIds),
      null,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentProductProps): Product {
    return new Product(
      Id.create(props.id),
      props.name,
      UnitPrice.create(props.unitPrice),
      Product.normalizeSku(props.sku),
      Product.normalizeText(props.unit, PRODUCT_UNIT_MAX_LENGTH),
      Product.normalizeText(props.description, PRODUCT_DESCRIPTION_MAX_LENGTH),
      Product.normalizeText(props.imageUrl, PRODUCT_IMAGE_URL_MAX_LENGTH),
      Product.normalizeExpiryDate(props.expiryDate),
      Product.normalizeText(props.warning, PRODUCT_WARNING_MAX_LENGTH),
      Product.normalizeCategoryIds(props.categoryIds),
      props.deletedAt ?? null,
      props.createdAt,
      props.updatedAt,
    );
  }

  public update(props: UpdateProductProps): void {
    this.name = props.name;
    this.unitPrice = UnitPrice.create(props.unitPrice);

    if (props.sku !== undefined) this.sku = Product.normalizeSku(props.sku);
    if (props.unit !== undefined) {
      this.unit = Product.normalizeText(props.unit, PRODUCT_UNIT_MAX_LENGTH);
    }
    if (props.description !== undefined) {
      this.description = Product.normalizeText(
        props.description,
        PRODUCT_DESCRIPTION_MAX_LENGTH,
      );
    }
    if (props.imageUrl !== undefined) {
      this.imageUrl = Product.normalizeText(
        props.imageUrl,
        PRODUCT_IMAGE_URL_MAX_LENGTH,
      );
    }
    if (props.expiryDate !== undefined) {
      this.expiryDate = Product.normalizeExpiryDate(props.expiryDate);
    }
    if (props.warning !== undefined) {
      this.warning = Product.normalizeText(
        props.warning,
        PRODUCT_WARNING_MAX_LENGTH,
      );
    }
    if (props.categoryIds !== undefined) {
      this.categoryIds = Product.normalizeCategoryIds(props.categoryIds);
    }

    this.updatedAt = new Date();
  }

  public updateName(newName: string): void {
    this.name = newName;
    this.updatedAt = new Date();
  }

  public updateUnitPrice(newUnitPrice: string): void {
    this.unitPrice = UnitPrice.create(newUnitPrice);
    this.updatedAt = new Date();
  }

  public setCategoryIds(categoryIds: string[]): void {
    this.categoryIds = Product.normalizeCategoryIds(categoryIds);
    this.updatedAt = new Date();
  }

  public softDelete(): void {
    if (this.isDeleted()) {
      throw new ProductAlreadyDeletedException(this.getId());
    }

    const now = new Date();
    this.deletedAt = now;
    this.updatedAt = now;
  }

  public restore(): void {
    if (!this.isDeleted()) {
      throw new ProductNotDeletedException(this.getId());
    }

    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getName(): string {
    return this.name;
  }

  public getUnitPrice(): string {
    return this.unitPrice.toString();
  }

  public getSku(): string | null {
    return this.sku;
  }

  public getUnit(): string | null {
    return this.unit;
  }

  public getDescription(): string | null {
    return this.description;
  }

  public getImageUrl(): string | null {
    return this.imageUrl;
  }

  public getExpiryDate(): string | null {
    return this.expiryDate;
  }

  public getWarning(): string | null {
    return this.warning;
  }

  public getCategoryIds(): readonly string[] {
    return this.categoryIds;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  public getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  private static normalizeCategoryIds(categoryIds: string[] = []): string[] {
    return [
      ...new Set(
        categoryIds
          .filter((id) => id?.trim())
          .map((id) => Id.create(id).getValue()),
      ),
    ];
  }

  private static normalizeSku(sku?: string | null): string | null {
    return normalizeProductSku(sku);
  }

  private static normalizeText(
    value: string | null | undefined,
    maxLength: number,
  ): string | null {
    const trimmed = value?.trim();

    return trimmed ? trimmed.slice(0, maxLength) : null;
  }

  private static normalizeExpiryDate(value?: string | null): string | null {
    const trimmed = value?.trim();

    if (!trimmed) return null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new InvalidProductExpiryDateException();
    }

    const parsed = new Date(`${trimmed}T00:00:00.000Z`);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== trimmed
    ) {
      throw new InvalidProductExpiryDateException();
    }

    return trimmed;
  }
}
