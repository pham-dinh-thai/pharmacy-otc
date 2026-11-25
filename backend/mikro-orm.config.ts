import { defineConfig } from '@mikro-orm/postgresql';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { MikroProduct } from './src/modules/products/infrastructure/entities/mikro-product.entity';
import { MikroBatch } from './src/modules/inventories/infrastructure/entities/mikro-batch.entity';
import { MikroInventory } from './src/modules/inventories/infrastructure/entities/mikro-inventory.entity';
import { MikroSupplier } from './src/modules/suppliers/infrastructure/entities/mikro-supplier.entity';
import { MikroGoodsReceipt } from './src/modules/goods-receipts/infrastructure/entities/mikro-goods-receipt.entity';
import { MikroGoodsReceiptLine } from './src/modules/goods-receipts/infrastructure/entities/mikro-goods-receipt-line.entity';
import { MikroUser } from './src/modules/users/infrastructure/entities/mikro-user.entity';
import { MikroAccount } from './src/modules/authentication/infrastructure/entities/mikro-account.entity';
import { MikroCustomer } from './src/modules/customers/infrastructure/entities/mikro-customer.entity';
import { MikroCustomerPhone } from './src/modules/customers/infrastructure/entities/mikro-customer-phone.entity';
import { MikroCustomerAddress } from './src/modules/customers/infrastructure/entities/mikro-customer-address.entity';
import { MikroRole } from './src/modules/authorization/infrastructure/entities/mikro-role.entity';
import { MikroAuditLog } from './src/modules/audit-logs/infrastructure/entities/mikro-audit-log.entity';
import { MikroExpense } from './src/modules/expenses/infrastructure/entities/mikro-expense.entity';
import { MikroEmployee } from './src/modules/employees/infrastructure/entities/mikro-employee.entity';
import { MikroDepartment } from './src/modules/departments/infrastructure/entities/mikro-department.entity';
import { MikroCategory } from './src/modules/categories/infrastructure/entities/mikro-category.entity';
import { MikroProductCategory } from './src/modules/categories/infrastructure/entities/mikro-product-category.entity';
import { MikroCart } from './src/modules/carts/infrastructure/entities/mikro-cart.entity';
import { MikroCartItem } from './src/modules/carts/infrastructure/entities/mikro-cart-item.entity';
import { MikroCheckout } from './src/modules/checkouts/infrastructure/entities/mikro-checkout.entity';
import { MikroCheckoutLine } from './src/modules/checkouts/infrastructure/entities/mikro-checkout-line.entity';
import { MikroOrder } from './src/modules/orders/infrastructure/entities/mikro-order.entity';
import { MikroOrderLine } from './src/modules/orders/infrastructure/entities/mikro-order-line.entity';

dotenv.config({ path: path.resolve('../.env') });

export default defineConfig({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dbName: process.env.POSTGRES_DB,

  entities: [
    MikroProduct,
    MikroBatch,
    MikroInventory,
    MikroSupplier,
    MikroGoodsReceipt,
    MikroGoodsReceiptLine,
    MikroUser,
    MikroAccount,
    MikroCustomer,
    MikroCustomerPhone,
    MikroCustomerAddress,
    MikroRole,
    MikroAuditLog,
    MikroExpense,
    MikroDepartment,
    MikroEmployee,
    MikroCategory,
    MikroProductCategory,
    MikroCart,
    MikroCartItem,
    MikroCheckout,
    MikroCheckoutLine,
    MikroOrder,
    MikroOrderLine,
  ],
  entitiesTs: [
    MikroProduct,
    MikroBatch,
    MikroInventory,
    MikroSupplier,
    MikroGoodsReceipt,
    MikroGoodsReceiptLine,
    MikroUser,
    MikroAccount,
    MikroCustomer,
    MikroCustomerPhone,
    MikroCustomerAddress,
    MikroRole,
    MikroAuditLog,
    MikroExpense,
    MikroDepartment,
    MikroEmployee,
    MikroCategory,
    MikroProductCategory,
    MikroCart,
    MikroCartItem,
    MikroCheckout,
    MikroCheckoutLine,
    MikroOrder,
    MikroOrderLine,
  ],

  debug: process.env.NODE_ENV !== 'production',

  migrations: {
    tableName: 'mikro_orm_migrations',
    path: './dist/src/migrations',
    pathTs: './src/migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    emit: 'ts',
  },
});
