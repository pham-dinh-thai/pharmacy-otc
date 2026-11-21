import { Module } from '@nestjs/common';
import { SuppliersController } from './presentation/suppliers/suppliers.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroSupplier } from './infrastructure/entities/mikro-supplier.entity';
import { SUPPLIERS_REPOSITORY } from './domain/suppliers.repository';
import { MikroSuppliersRepository } from './infrastructure/repositories/mikro-suppliers.repository';
import { CreateSupplierHandler } from './application/commands/create-supplier/create-supplier.handler';
import { UpdateSupplierHandler } from './application/commands/update-supplier/update-supplier.handler';
import { DeleteSupplierHandler } from './application/commands/delete-supplier/delete-supplier.handler';
import { RestoreSupplierHandler } from './application/commands/restore-supplier/restore-supplier.handler';
import { GetSupplierHandler } from './application/queries/get-supplier/get-supplier.handler';
import { GetSuppliersHandler } from './application/queries/get-suppliers/get-suppliers.handler';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroSupplier]),
    SecurityModule,
    OutBoxModule,
  ],
  controllers: [SuppliersController],
  providers: [
    { provide: SUPPLIERS_REPOSITORY, useClass: MikroSuppliersRepository },
    CreateSupplierHandler,
    UpdateSupplierHandler,
    DeleteSupplierHandler,
    RestoreSupplierHandler,
    GetSupplierHandler,
    GetSuppliersHandler,
  ],
  exports: [SUPPLIERS_REPOSITORY],
})
export class SuppliersModule {}
