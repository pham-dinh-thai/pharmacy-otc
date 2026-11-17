export class PermissionCatalogResource {
  public constructor(
    public readonly resource: string,
    public readonly actions: string[],
  ) {}
}

export class PermissionCatalogResponse {
  public constructor(public readonly resources: PermissionCatalogResource[]) {}
}
