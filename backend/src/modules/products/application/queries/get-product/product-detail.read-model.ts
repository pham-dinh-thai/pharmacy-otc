export class ProductDetailReadModel {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unitPrice: string,
    public readonly sku: string | null,
    public readonly unit: string | null,
    public readonly description: string | null,
    public readonly imageUrl: string | null,
    public readonly warning: string | null,
    public readonly categoryIds: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
