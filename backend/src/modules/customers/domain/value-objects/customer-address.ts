import { Id } from '../../../../shared/value-objects/id.value-object';

export type CustomerAddressPersistentProps = {
  id: string;
  address: string;
  isDefault: boolean;
};

export type CustomerAddressInput = {
  address: string;
  isDefault?: boolean;
};

export class CustomerAddress {
  private constructor(
    private readonly id: Id,
    private address: string,
    private isDefault: boolean,
  ) {}

  public static create(input: CustomerAddressInput): CustomerAddress {
    return new CustomerAddress(
      Id.generate(),
      input.address.trim(),
      !!input.isDefault,
    );
  }

  public static fromPersistent(
    props: CustomerAddressPersistentProps,
  ): CustomerAddress {
    return new CustomerAddress(
      Id.create(props.id),
      props.address,
      props.isDefault,
    );
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getAddress(): string {
    return this.address;
  }

  public getIsDefault(): boolean {
    return this.isDefault;
  }

  public setIsDefault(isDefault: boolean): void {
    this.isDefault = isDefault;
  }

  public update(address: string): void {
    this.address = address.trim();
  }
}
