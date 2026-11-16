import Link from 'next/link';
import { CATEGORIES } from '@/data/mock-data';
import { Container } from './Container';

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-[17px] font-extrabold tracking-[-0.03em]">
            PharmaOTC
          </p>
          <p className="mt-2 max-w-[40ch] text-[13px] leading-6 text-muted">
            Tra cứu thuốc không kê đơn theo tên, hoạt chất và nhóm sản phẩm.
          </p>
        </div>

        <div>
          <h2 className="text-[13px] font-medium text-muted">Danh mục</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/?danh-muc=${category.id}`}
                  className="hover:text-accent"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[13px] font-medium text-muted">Liên kết</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            <li>
              <Link href="/" className="hover:text-accent">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-accent">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-rule py-5 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 PharmaOTC</p>
        <p>Đọc kỹ hướng dẫn sử dụng trước khi dùng.</p>
      </Container>
    </footer>
  );
}
