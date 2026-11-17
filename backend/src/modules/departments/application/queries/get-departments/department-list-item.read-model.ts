export class DepartmentListItemReadModel {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
