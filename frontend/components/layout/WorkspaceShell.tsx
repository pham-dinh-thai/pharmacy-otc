import Link from 'next/link';
import { handleLogout } from '@/app/(features)/login/actions';
import { Container } from './Container';
import { WorkspaceNav, type WorkspaceNavGroup } from './WorkspaceNav';

export function WorkspaceShell({
  nav,
  children,
}: {
  nav?: WorkspaceNavGroup[];
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

          <nav className="flex items-center gap-4 text-[13px] font-medium sm:gap-5">
            <Link href="/" className="hover:text-accent">
              Cửa hàng
            </Link>
            <Link href="/account" className="hover:text-accent">
              Tài khoản
            </Link>
            <form action={handleLogout}>
              <button type="submit" className="hover:text-accent">
                Đăng xuất
              </button>
            </form>
          </nav>
        </Container>
      </header>

      <main className="flex-1">
        <Container
          className={
            nav ? 'lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12' : ''
          }
        >
          {nav && (
            <aside className="-mx-5 border-b border-rule px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:border-b-0 lg:border-r lg:px-0 lg:py-10">
              <WorkspaceNav groups={nav} />
            </aside>
          )}

          <div className="min-w-0 py-10 sm:py-14">{children}</div>
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

export function WorkspacePage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.04em]">
        {title}
      </h1>
      <p className="mt-4 max-w-[62ch] text-[14px] leading-6 text-muted">
        {intro}
      </p>

      <div className="mt-10">{children}</div>
    </>
  );
}
