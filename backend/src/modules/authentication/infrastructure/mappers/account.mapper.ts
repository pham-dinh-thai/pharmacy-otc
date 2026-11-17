import { Account } from '../../domain/account.aggregate';
import { MikroAccount } from '../entities/mikro-account.entity';

export class AccountMapper {
  public static toDomain(mikroAccount: MikroAccount): Account {
    return Account.fromPersistent({
      id: mikroAccount.id,
      userId: mikroAccount.userId,
      password: mikroAccount.password,
      isActive: mikroAccount.isActive,
      mustChangePassword: mikroAccount.mustChangePassword,
      createdAt: mikroAccount.createdAt,
      updatedAt: mikroAccount.updatedAt,
    });
  }

  public static toMikroOrm(account: Account): MikroAccount {
    const mikroAccount = new MikroAccount();

    mikroAccount.id = account.getId();
    mikroAccount.userId = account.getUserId();
    mikroAccount.password = account.getPassword();
    mikroAccount.isActive = account.getIsActive();
    mikroAccount.mustChangePassword = account.getMustChangePassword();
    mikroAccount.createdAt = account.getCreatedAt();
    mikroAccount.updatedAt = account.getUpdatedAt();

    return mikroAccount;
  }
}
