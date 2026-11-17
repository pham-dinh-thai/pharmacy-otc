import { describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { MANAGE_ACTION } from '../../domain/permission/permission-catalog';
import { PermissionsController } from './permissions.controller';

describe('PermissionsController', () => {
  it('returns every resource with its actions and the manage wildcard', async () => {
    const module = await Test.createTestingModule({
      controllers: [PermissionsController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const controller = module.get(PermissionsController);
    const { resources } = controller.findAll();

    const roles = resources.find((item) => item.resource === 'roles');

    expect(roles?.actions).toEqual(
      expect.arrayContaining(['read', 'create', MANAGE_ACTION]),
    );
    expect(resources.map((item) => item.resource)).toEqual(
      expect.arrayContaining(['orders', 'products', 'reports']),
    );
  });
});
