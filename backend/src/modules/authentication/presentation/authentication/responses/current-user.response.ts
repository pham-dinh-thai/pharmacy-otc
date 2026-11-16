export class CurrentUserResponse {
  public constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly isSuperAdmin: boolean,
    public readonly permissions: string[],
  ) {}
}
