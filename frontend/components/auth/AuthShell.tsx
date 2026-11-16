import Link from 'next/link';
import { Container } from '@/components/layout/Container';

export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
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
          <Link
            href="/"
            className="text-[13px] text-muted hover:text-ink"
          >
            Về trang chủ
          </Link>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="grid gap-10 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-5">
            <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
              {title}
            </h1>
            <p className="mt-4 max-w-[38ch] text-[14px] leading-6 text-muted">
              {intro}
            </p>
          </div>

          <div className="max-w-[440px] lg:col-span-5 lg:col-start-8">
            {children}
          </div>
        </Container>
      </main>

      <footer className="border-t border-rule">
        <Container className="py-5 text-[12px] text-muted">
          © 2026 PharmaOTC
        </Container>
      </footer>
    </div>
  );
}
