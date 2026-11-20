'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { ProductOption } from '@/lib/categories';

const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-3 text-[14px] placeholder:text-muted/60 focus:border-ink';

function productLabel(product: ProductOption): string {
  return product.sku ? `${product.name} (${product.sku})` : product.name;
}

/**
 * Ô chọn sản phẩm có tìm kiếm theo tên/mã SKU. Kết quả được lấy từ API theo
 * từ khoá, nên không bị giới hạn ở danh sách sản phẩm nạp ban đầu.
 */
export function ProductPicker({
  id,
  name,
  initialOptions,
  searchAction,
}: {
  id: string;
  name: string;
  initialOptions: ProductOption[];
  searchAction: (keyword: string) => Promise<ProductOption[]>;
}) {
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<ProductOption | null>(null);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ProductOption[] | null>(null);
  const [searchedTerm, setSearchedTerm] = useState('');
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const search = selected ? '' : keyword.trim();
  const showResults =
    search.length > 0 && searchedTerm === search && results !== null;
  const options = showResults ? results : initialOptions;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);

    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!search) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const data = await searchAction(search);
        setResults(data);
        setSearchedTerm(search);
        setOpen(true);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [search, searchAction]);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ''} />
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        value={keyword}
        placeholder="Tìm theo tên hoặc mã SKU..."
        onChange={(event) => {
          setKeyword(event.target.value);
          setSelected(null);
          setResults(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={INPUT_CLASS}
      />

      {selected && (
        <p className="mt-1 truncate text-[12px] text-emerald-700">
          Đã chọn: {productLabel(selected)}
        </p>
      )}

      {open && !selected && (
        <div
          id={`${id}-options`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto border border-rule bg-paper shadow-lg"
        >
          {pending ? (
            <p className="px-3 py-2 text-[13px] text-muted">Đang tìm...</p>
          ) : options.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-muted">
              Không tìm thấy sản phẩm
            </p>
          ) : (
            options.map((product) => (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  setSelected(product);
                  setKeyword(productLabel(product));
                  setOpen(false);
                }}
                className="block w-full px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-rule/30"
              >
                {productLabel(product)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
