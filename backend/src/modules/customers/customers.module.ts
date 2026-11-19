import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MikroCustomerAddress } from './infrastructure/entities/mikro-customer-address.entity';
import { MikroCustomerPhone } from './infrastructure/entities/mikro-customer-phone.entity';
import { MikroCustomer } from './infrastructure/entities/mikro-customer.entity';
import { CUSTOMERS_REPOSITORY } from './domain/customers.repository';
import { MikroCustomersRepository } from './infrastructure/repositories/mikro-customers.repository';
import { CustomersController } from './presentation/customers/customers.controller';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';
import { UsersModule } from '../users/users.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { CustomerReadModelFactory } from './application/queries/customer-read-model.factory';
import { CreateCustomerHandler } from './application/commands/create-customer/create-customer.handler';
import { CreateCustomerByAdminHandler } from './application/commands/create-customer-by-admin/create-customer-by-admin.handler';
import { UpdateCustomerHandler } from './application/commands/update-customer/update-customer.handler';
import { DeleteCustomerHandler } from './application/commands/delete-customer/delete-customer.handler';
import { RestoreCustomerHandler } from './application/commands/restore-customer/restore-customer.handler';
import { GetCustomerHandler } from './application/queries/get-customer/get-customer.handler';
import { GetCustomersHandler } from './application/queries/get-customers/get-customers.handler';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      MikroCustomer,
      MikroCustomerPhone,
      MikroCustomerAddress,
    ]),
    SecurityModule,
    OutBoxModule,
    UsersModule,
    AuthenticationModule,
  ],
  controllers: [CustomersController],
  providers: [
    { provide: CUSTOMERS_REPOSITORY, useClass: MikroCustomersRepository },
    CustomerReadModelFactory,
    CreateCustomerHandler,
    CreateCustomerByAdminHandler,
    UpdateCustomerHandler,
    DeleteCustomerHandler,
    RestoreCustomerHandler,
    GetCustomerHandler,
    GetCustomersHandler,
  ],
  exports: [CUSTOMERS_REPOSITORY],
})
export class CustomersModule {}
