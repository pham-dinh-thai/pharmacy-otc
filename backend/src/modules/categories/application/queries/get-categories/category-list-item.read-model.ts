export class CategoryListItemReadModel {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly deletedAt: Date | null,
  ) {}
}
