import { Test } from '@nestjs/testing';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { EmployeesController } from './employees.controller';

describe('EmployeesController', () => {
  it('is defined with authentication and permission guards', async () => {
    const module = await Test.createTestingModule({
      controllers: [EmployeesController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    expect(module.get(EmployeesController)).toBeDefined();
  });
});
