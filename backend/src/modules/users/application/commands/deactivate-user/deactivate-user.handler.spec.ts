import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { DeactivateUserHandler } from './deactivate-user.handler';
import { DeactivateUserCommand } from './deactivate-user.command';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../../authentication/domain/accounts.repository';
import { Account } from '../../../../authentication/domain/account.aggregate';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { USER_DEACTIVATED_EVENT } from '../../../domain/events/user-deactivated.event';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const USER_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const ACCOUNT_ID = '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50';

const accountWithStatus = (isActive: boolean): Account =>
  Account.fromPersistent({
    id: ACCOUNT_ID,
    userId: USER_ID,
    password: 'hashed-password',
    isActive,
    mustChangePassword: false,
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
  });

describe('DeactivateUserHandler', () => {
  let handler: DeactivateUserHandler;
  let accountsRepository: jest.Mocked<
    Pick<IAccountsRepository, 'findByUserId' | 'update'>
  >;
  let outboxRepository: jest.Mocked<Pick<IOutboxRepository, 'create'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    accountsRepository = {
      findByUserId: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<IAccountsRepository, 'findByUserId' | 'update'>
    >;
    outboxRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<Pick<IOutboxRepository, 'create'>>;
    unitOfWork = {
      run: jest.fn(async (callback: () => Promise<unknown>) => callback()),
    } as unknown as jest.Mocked<IUnitOfWork>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: ACCOUNTS_REPOSITORY, useValue: accountsRepository },
        { provide: OUTBOX_REPOSITORY, useValue: outboxRepository },
        { provide: UNIT_OF_WORK, useValue: unitOfWork },
        DeactivateUserHandler,
      ],
    }).compile();

    handler = moduleRef.get(DeactivateUserHandler);
  });

  it('does nothing when the user has no login account', async () => {
    accountsRepository.findByUserId.mockResolvedValue(null);

    await handler.execute(new DeactivateUserCommand(USER_ID, headers));

    expect(accountsRepository.update).not.toHaveBeenCalled();
    expect(outboxRepository.create).not.toHaveBeenCalled();
  });

  it('does nothing when the account is already inactive', async () => {
    accountsRepository.findByUserId.mockResolvedValue(accountWithStatus(false));

    await handler.execute(new DeactivateUserCommand(USER_ID, headers));

    expect(accountsRepository.update).not.toHaveBeenCalled();
    expect(outboxRepository.create).not.toHaveBeenCalled();
  });

  it('deactivates the account and appends an audit event', async () => {
    const account = accountWithStatus(true);
    accountsRepository.findByUserId.mockResolvedValue(account);

    const result = await handler.execute(
      new DeactivateUserCommand(USER_ID, headers),
    );

    expect(account.getIsActive()).toBe(false);
    expect(accountsRepository.update).toHaveBeenCalledWith(account);
    expect(outboxRepository.create).toHaveBeenCalledWith({
      eventType: USER_DEACTIVATED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.ACCOUNTS,
          entityId: ACCOUNT_ID,
          before: { isActive: true },
          after: { isActive: false },
          metadata: { userId: USER_ID },
        },
      },
    });
    expect(result).toEqual({ userId: USER_ID });
  });
});
