import { Id } from '../../../shared/value-objects/id.value-object';
import { Quantity } from '../../../shared/value-objects/quantity.value-object';
import {
  ProductAlreadyDeletedException,
  ProductNotDeletedException,
} from './exceptions/product.exceptions';
import { UnitPrice } from './value-objects/unit-price.object-value';

export type ProductInput = {
  name: string;
  unitPrice: string;
  quantity: number;
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
    private quantity: Quantity,
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
      Quantity.create(props.quantity),
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
      Quantity.create(props.quantity),
      Product.normalizeCategoryIds(props.categoryIds),
      props.deletedAt ?? null,
      props.createdAt,
      props.updatedAt,
    );
  }

  public update(props: UpdateProductProps): void {
    this.name = props.name;
    this.unitPrice = UnitPrice.create(props.unitPrice);
    this.quantity = Quantity.create(props.quantity);

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

  public updateQuantity(newQuantity: number): void {
    this.quantity = Quantity.create(newQuantity);
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

  public getQuantity(): number {
    return this.quantity.getValue();
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
}
