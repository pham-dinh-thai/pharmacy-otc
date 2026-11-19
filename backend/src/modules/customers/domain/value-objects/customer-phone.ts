import { Id } from '../../../../shared/value-objects/id.value-object';

export type CustomerPhonePersistentProps = {
  id: string;
  phone: string;
  isPrimary: boolean;
};

export type CustomerPhoneInput = {
  phone: string;
  isPrimary?: boolean;
};

export class CustomerPhone {
  private constructor(
    private readonly id: Id,
    private readonly phone: string,
    private isPrimary: boolean,
  ) {}

  public static create(input: CustomerPhoneInput): CustomerPhone {
    return new CustomerPhone(
      Id.generate(),
      input.phone.trim(),
      !!input.isPrimary,
    );
  }

  public static fromPersistent(
    props: CustomerPhonePersistentProps,
  ): CustomerPhone {
    return new CustomerPhone(Id.create(props.id), props.phone, props.isPrimary);
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getPhone(): string {
    return this.phone;
  }

  public getIsPrimary(): boolean {
    return this.isPrimary;
  }

  public setIsPrimary(isPrimary: boolean): void {
    this.isPrimary = isPrimary;
  }
}
