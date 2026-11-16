import Link from 'next/link';
import { SearchBox } from '@/components/search/SearchBox';
import { SEARCH_CATEGORIES } from '@/data/search-data';
import { Container } from '@/components/layout/Container';

export function Hero() {
  return (
    <Container>
      <div className="grid gap-12 border-b border-rule py-14 lg:grid-cols-12 lg:gap-12 lg:py-24">
        <div className="lg:col-span-7">
          <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.92] tracking-[-0.045em]">
            <span className="block font-extrabold">Tìm thuốc</span>
            <span className="block font-normal">không kê đơn.</span>
          </h1>

          <p className="mt-6 max-w-[46ch] text-[15px] leading-7 text-muted">
            Tra theo tên thuốc, hoạt chất hoặc nhóm sản phẩm.
          </p>

          <SearchBox
            variant="hero"
            inputId="q"
            ariaLabel="Tìm thuốc trong danh mục"
            className="mt-8 max-w-xl"
          />
        </div>

        <aside className="lg:col-span-5 lg:pt-2">
          <h2 className="text-[13px] font-medium text-muted">Danh mục</h2>
          <ul className="mt-3 border-t border-rule">
            {SEARCH_CATEGORIES.map((category) => (
              <li key={category.id} className="border-b border-rule">
                <Link
                  href={`/?danh-muc=${category.id}`}
                  className="group flex items-baseline justify-between gap-4 py-3.5"
                >
                  <span className="text-[15px] font-semibold group-hover:text-accent">
                    {category.name}
                  </span>
                  <span className="tabular-nums text-[13px] text-muted">
                    {category.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Container>
  );
}
