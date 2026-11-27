import { Id } from '../../../shared/domain/value-objects/id.value-object';
import {
  CurrentPasswordMismatchException,
  NewPasswordConfirmationMismatchException,
} from './exceptions/authentication.exceptions';
import { Password } from './password.value-object';

export type CreateAccountProps = {
  userId: string;
  password: string;
  mustChangePassword?: boolean;
};

export type FromPersistentAccountProps = {
  id: string;
  userId: string;
  password: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class Account {
  private constructor(
    private readonly id: Id,
    private readonly userId: string,
    private password: Password,
    private isActive: boolean,
    private mustChangePassword: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static async create(props: CreateAccountProps): Promise<Account> {
    const now = new Date();

    return new Account(
      Id.generate(),
      props.userId,
      await Password.fromPlainText(props.password),
      true,
      props.mustChangePassword ?? false,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentAccountProps): Account {
    return new Account(
      Id.create(props.id),
      props.userId,
      Password.fromHashed(props.password),
      props.isActive,
      props.mustChangePassword,
      props.createdAt,
      props.updatedAt,
    );
  }

  public async verify(plain: string): Promise<boolean> {
    return this.password.verify(plain);
  }

  public deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    this.updatedAt = new Date();
  }

  public async restorePassword(newPassword: string): Promise<void> {
    this.password = await Password.fromPlainText(newPassword);

    this.updatedAt = new Date();
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ): Promise<void> {
    const isMatchesWithCurrentPassword =
      await this.password.verify(currentPassword);
    if (!isMatchesWithCurrentPassword) {
      throw new CurrentPasswordMismatchException();
    }

    if (newPassword !== newPasswordConfirmation) {
      throw new NewPasswordConfirmationMismatchException();
    }

    this.password = await Password.fromPlainText(newPassword);
    this.mustChangePassword = false;

    this.updatedAt = new Date();
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getUserId(): string {
    return this.userId;
  }

  public getPassword(): string {
    return this.password.getValue();
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getMustChangePassword(): boolean {
    return this.mustChangePassword;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
