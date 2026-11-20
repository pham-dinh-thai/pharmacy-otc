'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { ProductOption } from '@/lib/categories';
import type { SupplierOption } from '@/lib/goods-receipts';

const LABEL_CLASS = 'block text-[12px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[13px] placeholder:text-muted/60 focus:border-ink disabled:bg-rule/30';

export function GoodsReceiptForm({
  action,
  supplierOptions,
  productOptions,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  supplierOptions: SupplierOption[];
  productOptions: ProductOption[];
  submitLabel: string;
  cancelHref: string;
}) {
  const [lineKeys, setLineKeys] = useState<number[]>([0]);
  const nextKeyRef = useRef(1);

  return (
    <form action={action} className="px-6 py-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="supplierId" className={LABEL_CLASS}>
            Nhà cung cấp
          </label>
          <select
            id="supplierId"
            name="supplierId"
            required
            defaultValue=""
            className={INPUT_CLASS}
          >
            <option value="" disabled>
              Chọn nhà cung cấp
            </option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} · {supplier.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 border-t border-rule pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold">Dòng nhập kho</h3>
            <p className="mt-1 text-[12px] text-muted">
              Mỗi dòng là một lô hàng: sản phẩm, số lô, số lượng, giá nhập và
              hạn dùng.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setLineKeys((keys) => [...keys, nextKeyRef.current++])
            }
            className="border border-rule px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            + Thêm dòng
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {lineKeys.map((key, index) => (
            <div
              key={key}
              className="grid gap-4 border border-rule bg-paper p-4 md:grid-cols-[2fr_1fr_0.7fr_1fr_1fr_auto]"
            >
              <div>
                <label className={LABEL_CLASS} htmlFor={`product-${key}`}>
                  Sản phẩm
                </label>
                <select
                  id={`product-${key}`}
                  name="productId"
                  required
                  defaultValue=""
                  className={INPUT_CLASS}
                >
                  <option value="" disabled>
                    Chọn sản phẩm
                  </option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku
                        ? `${product.name} (${product.sku})`
                        : product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor={`lot-${key}`}>
                  Số lô
                </label>
                <input
                  id={`lot-${key}`}
                  name="lotNumber"
                  type="text"
                  required
                  maxLength={50}
                  placeholder="Ví dụ: LOT-001"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor={`quantity-${key}`}>
                  Số lượng
                </label>
                <input
                  id={`quantity-${key}`}
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  required
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor={`cost-${key}`}>
                  Giá nhập (VND)
                </label>
                <input
                  id={`cost-${key}`}
                  name="unitCost"
                  type="text"
                  inputMode="numeric"
                  pattern="\d+"
                  required
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor={`expiry-${key}`}>
                  Hạn dùng
                </label>
                <input
                  id={`expiry-${key}`}
                  name="expiresAt"
                  type="date"
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex items-end md:pb-1">
                <button
                  type="button"
                  onClick={() =>
                    setLineKeys((keys) => keys.filter((item) => item !== key))
                  }
                  disabled={lineKeys.length === 1}
                  aria-label={`Xoá dòng ${index + 1}`}
                  className="border border-rule px-3 py-2.5 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        <button
          type="submit"
          className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
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
