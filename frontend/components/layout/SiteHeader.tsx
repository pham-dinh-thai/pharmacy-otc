'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { SearchBox } from '@/components/search/SearchBox';
import { Container } from './Container';

type NavCategory = {
  id: string;
  name: string;
  shortName: string;
};

export function SiteHeader({
  categories,
  authSlot,
}: {
  categories: NavCategory[];
  authSlot?: React.ReactNode;
}) {
  const { totalItems, openCart } = useCart();

  return (
    <header className="z-40 border-b border-rule bg-paper lg:sticky lg:top-0">
      <Container className="flex h-16 items-center gap-3 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center bg-accent text-[18px] leading-none text-paper"
          >
            +
          </span>
          <span className="text-[19px] font-extrabold tracking-[-0.03em]">
            PharmaOTC
          </span>
        </Link>

        <SearchBox
          variant="header"
          inputId="header-q"
          ariaLabel="Tìm thuốc"
          className="hidden min-w-0 max-w-[420px] flex-1 md:block"
        />

        <div className="ml-auto flex items-center gap-4 text-[13px] font-medium sm:gap-5">
          <button
            type="button"
            onClick={openCart}
            className="flex items-baseline gap-1.5 hover:text-accent"
          >
            <span className="sm:hidden">Giỏ</span>
            <span className="hidden sm:inline">Giỏ hàng</span>
            <span className="tabular-nums text-muted">({totalItems})</span>
          </button>

          {authSlot ?? (
            <Link href="/login" className="hover:text-accent">
              Đăng nhập
            </Link>
          )}
        </div>
      </Container>

      <div className="overflow-x-auto border-t border-rule">
        <Container className="flex gap-6 whitespace-nowrap py-2.5 text-[13px] font-medium text-muted lg:gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?danh-muc=${category.id}`}
              className="hover:text-ink"
            >
              {category.shortName}
            </Link>
          ))}
        </Container>
      </div>
    </header>
  );
}
