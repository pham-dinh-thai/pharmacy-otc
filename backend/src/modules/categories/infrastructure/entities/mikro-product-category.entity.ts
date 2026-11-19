import { Entity, ManyToOne } from '@mikro-orm/decorators/legacy';
import { MikroCategory } from './mikro-category.entity';
import { MikroProduct } from '../../../products/infrastructure/entities/mikro-product.entity';

/** Bảng trung gian cho quan hệ N-N giữa sản phẩm và danh mục. */
@Entity({ tableName: 'product_categories' })
export class MikroProductCategory {
  @ManyToOne(() => MikroCategory, {
    fieldName: 'category_id',
    mapToPk: true,
    primary: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  categoryId!: string;

  @ManyToOne(() => MikroProduct, {
    fieldName: 'product_id',
    mapToPk: true,
    primary: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  productId!: string;
}
