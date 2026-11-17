import { describe, expect, it } from '@jest/globals';
import { Account } from './account.aggregate';
import { Password } from './password.value-object';

const makePersistent = async (mustChangePassword: boolean) => ({
  id: '0a4d9a9a-7b64-4a1b-8d1e-1f0e4e4b7c11',
  userId: '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50',
  password: (await Password.fromPlainText('secret123')).getValue(),
  isActive: true,
  mustChangePassword,
  createdAt: new Date('2026-11-17T00:00:00.000Z'),
  updatedAt: new Date('2026-11-17T00:00:00.000Z'),
});

describe('Account', () => {
  it('does not force a password change for regular sign-ups by default', async () => {
    const account = await Account.create({
      userId: '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50',
      password: 'secret123',
    });

    expect(account.getMustChangePassword()).toBe(false);
  });

  it('keeps the forced password change flag passed at creation', async () => {
    const account = await Account.create({
      userId: '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50',
      password: 'secret123',
      mustChangePassword: true,
    });

    expect(account.getMustChangePassword()).toBe(true);
  });

  it('clears the flag once the password is changed', async () => {
    const account = Account.fromPersistent(await makePersistent(true));

    await account.changePassword('secret123', 'secret456', 'secret456');

    expect(account.getMustChangePassword()).toBe(false);
  });

  it('keeps the flag when an administrator restores the password', async () => {
    const account = Account.fromPersistent(await makePersistent(true));

    await account.restorePassword('secret456');

    expect(account.getMustChangePassword()).toBe(true);
  });

  it('does not clear the flag when the current password is wrong', async () => {
    const account = Account.fromPersistent(await makePersistent(true));

    await expect(
      account.changePassword('wrong1234', 'secret456', 'secret456'),
    ).rejects.toThrow();
    expect(account.getMustChangePassword()).toBe(true);
  });
});
