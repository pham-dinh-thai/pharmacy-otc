import Link from 'next/link';
import type { CategoryOption } from '@/lib/products';

const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink disabled:bg-rule/30';

export type ProductFormValues = {
  name: string;
  unitPrice: string;
  quantity: string;
  categoryIds: string[];
};

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  unitPrice: '',
  quantity: '0',
  categoryIds: [],
};

/** Form dùng chung cho tạo và cập nhật sản phẩm. */
export function ProductForm({
  action,
  values,
  categories,
  submitLabel,
  cancelHref,
  productId = '',
  returnTo = '',
  locked = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: ProductFormValues;
  categories: CategoryOption[];
  submitLabel: string;
  cancelHref: string;
  productId?: string;
  returnTo?: string;
  locked?: boolean;
}) {
  return (
    <form action={action} className="grid gap-5 px-6 py-6 md:grid-cols-2">
      {productId && <input type="hidden" name="productId" value={productId} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <div>
        <label htmlFor="name" className={LABEL_CLASS}>
          Tên sản phẩm
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={255}
          defaultValue={values.name}
          disabled={locked}
          placeholder="Tên sản phẩm"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="unitPrice" className={LABEL_CLASS}>
          Đơn giá (VND)
        </label>
        <input
          id="unitPrice"
          name="unitPrice"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          defaultValue={values.unitPrice}
          disabled={locked}
          placeholder="Ví dụ: 25000"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="quantity" className={LABEL_CLASS}>
          Số lượng tồn
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={values.quantity}
          disabled={locked}
          className={INPUT_CLASS}
        />
      </div>

      <fieldset disabled={locked} className="md:col-span-2">
        <legend className={LABEL_CLASS}>Danh mục</legend>
        {categories.length > 0 ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 border border-rule px-3 py-2 text-[13px] has-checked:border-accent has-checked:bg-accent-soft"
              >
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={values.categoryIds.includes(category.id)}
                  className="accent-accent"
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[13px] leading-5 text-muted">
            Chưa có danh mục hoạt động để chọn. Có thể tạo sản phẩm không gắn
            danh mục.
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={locked}
          className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:bg-rule disabled:text-muted"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="border border-rule px-5 py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-ink hover:text-ink"
        >
          Huỷ
        </Link>
      </div>
    </form>
  );
}
