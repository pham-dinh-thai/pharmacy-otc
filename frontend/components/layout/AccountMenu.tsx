'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { handleLogout } from '@/app/(features)/login/actions';

const ITEM_CLASS =
  'block w-full px-4 py-2.5 text-left text-[13px] leading-5 hover:bg-surface';

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 hover:text-accent"
      >
        Tài khoản
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`h-2.5 w-2.5 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path
            d="M2 4.5 6 8.5l4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id="account-menu"
          className="absolute right-0 top-full z-50 mt-3 w-60 border border-rule bg-paper"
        >
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className={ITEM_CLASS}
          >
            Tài khoản của tôi
          </Link>

          <Link
            href="/account/password"
            onClick={() => setOpen(false)}
            className={ITEM_CLASS}
          >
            Đổi mật khẩu
          </Link>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className={ITEM_CLASS}
          >
            Không gian làm việc
          </Link>

          <div className="border-t border-rule">
            <form action={handleLogout}>
              <button type="submit" className={ITEM_CLASS}>
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
