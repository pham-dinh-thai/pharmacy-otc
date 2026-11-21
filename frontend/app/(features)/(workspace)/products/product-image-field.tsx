/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { PRODUCT_IMAGE_ACCEPT, PRODUCT_IMAGE_HINT } from '@/lib/product-image';

const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[13px] file:mr-3 file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-paper disabled:bg-rule/30';

/** File input + local preview; the server action uploads and sets imageUrl. */
export function ProductImageField({
  initialUrl,
  disabled,
}: {
  initialUrl: string;
  disabled: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(initialUrl || null);

  useEffect(
    () => () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  return (
    <div>
      <label
        htmlFor="image"
        className="block text-[13px] font-medium text-muted"
      >
        Ảnh sản phẩm
      </label>
      <input
        id="image"
        name="image"
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];

          setPreview(file ? URL.createObjectURL(file) : initialUrl || null);
        }}
        className={INPUT_CLASS}
      />
      <input type="hidden" name="imageUrl" defaultValue={initialUrl} />
      <p className="mt-1.5 text-[12px] leading-5 text-muted">
        {PRODUCT_IMAGE_HINT}
      </p>
      {preview ? (
        <img
          src={preview}
          alt="Xem trước ảnh sản phẩm"
          width={96}
          height={96}
          className="mt-3 h-24 w-24 border border-rule object-cover"
        />
      ) : (
        <div className="mt-3 flex h-24 w-24 items-center justify-center border border-dashed border-rule text-[12px] text-muted">
          Chưa có ảnh
        </div>
      )}
    </div>
  );
}
