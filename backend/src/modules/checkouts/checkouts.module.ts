import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CHECKOUTS_REPOSITORY } from './domain/checkouts.repository';
import { MikroCheckout } from './infrastructure/entities/mikro-checkout.entity';
import { MikroCheckoutLine } from './infrastructure/entities/mikro-checkout-line.entity';
import { MikroCheckoutsRepository } from './infrastructure/repositories/mikro-checkouts.repository';
import { CheckoutsController } from './presentation/checkouts/checkouts.controller';

@Module({
  imports: [MikroOrmModule.forFeature([MikroCheckout, MikroCheckoutLine])],
  controllers: [CheckoutsController],
  providers: [
    { provide: CHECKOUTS_REPOSITORY, useClass: MikroCheckoutsRepository },
  ],
  exports: [CHECKOUTS_REPOSITORY],
})
export class CheckoutsModule {}
