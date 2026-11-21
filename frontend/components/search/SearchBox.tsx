'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { IconSearch } from '@/components/icons/Icons';
import { SEARCH_KEYWORDS } from '@/data/search-data';
import type { StorefrontCategory } from '@/types';

const HISTORY_KEY = 'pharmaotc:search-history';
const HISTORY_LIMIT = 5;

type Variant = 'header' | 'hero';

function readHistory(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .slice(0, HISTORY_LIMIT);
  } catch {
    // localStorage bị chặn thì coi như chưa có lịch sử.
    return [];
  }
}

export function SearchBox({
  variant,
  inputId,
  ariaLabel,
  categories,
  className = '',
}: {
  variant: Variant;
  inputId: string;
  ariaLabel: string;
  categories: StorefrontCategory[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Panel đóng lúc render đầu nên đọc localStorage ngay trong initializer không gây lệch hydration.
  const [history, setHistory] = useState<string[]>(readHistory);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function saveHistory(next: string[]) {
    setHistory(next);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Bỏ qua nếu không ghi được.
    }
  }

  function remember(term: string) {
    const value = term.trim();
    if (!value) return;

    const next = [
      value,
      ...history.filter((item) => item.toLowerCase() !== value.toLowerCase()),
    ].slice(0, HISTORY_LIMIT);

    saveHistory(next);
  }

  function searchFor(term: string) {
    if (inputRef.current) inputRef.current.value = term;
    formRef.current?.requestSubmit();
  }

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        ref={formRef}
        action="/"
        method="get"
        role="search"
        aria-label={ariaLabel}
        onSubmit={() => {
          remember(inputRef.current?.value ?? '');
          setOpen(false);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Tìm thuốc theo tên hoặc hoạt chất
        </label>
        <div
          className={
            isHero
              ? 'flex items-center gap-2 border-b-2 border-ink focus-within:border-accent'
              : 'flex items-center gap-2 border-b border-rule focus-within:border-ink'
          }
        >
          {isHero ? (
            <IconSearch
              className="h-4 w-4 shrink-0 text-muted"
              aria-hidden="true"
            />
          ) : null}
          <input
            ref={inputRef}
            id={inputId}
            name="q"
            type="search"
            autoComplete="off"
            placeholder={
              isHero
                ? 'Paracetamol, Berberin, men vi sinh…'
                : 'Tìm thuốc, hoạt chất…'
            }
            className={
              isHero
                ? 'w-full bg-transparent py-3 text-[17px] outline-none placeholder:text-muted/70'
                : 'w-full bg-transparent py-2 text-[13px] outline-none placeholder:text-muted/70'
            }
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
          />
          <button
            type="submit"
            className={
              isHero
                ? 'shrink-0 px-2 py-3 text-[13px] font-semibold hover:text-accent'
                : 'shrink-0 text-[12px] font-semibold hover:text-accent'
            }
          >
            Tìm
          </button>
        </div>
      </form>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Gợi ý tìm kiếm"
          className="absolute inset-x-0 top-full z-30 mt-3 max-h-[70vh] overflow-y-auto overscroll-contain border border-rule bg-paper"
        >
          <section className="border-b border-rule px-4 py-4">
            <h2 className="text-[12px] font-medium text-muted">Danh mục</h2>
            <ul className="mt-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/?category=${category.id}`}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline justify-between gap-4 py-2 text-[14px]"
                  >
                    <span className="group-hover:text-accent">
                      {category.name}
                    </span>
                    <span className="tabular-nums text-[12px] text-muted">
                      {category.productCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-b border-rule px-4 py-4">
            <h2 className="text-[12px] font-medium text-muted">
              Từ khoá gợi ý
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[13px]">
              {SEARCH_KEYWORDS.map((keyword) => (
                <li key={keyword}>
                  <button
                    type="button"
                    onClick={() => searchFor(keyword)}
                    className="underline decoration-rule underline-offset-4 hover:text-accent"
                  >
                    {keyword}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="px-4 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-[12px] font-medium text-muted">
                Tìm kiếm gần đây
              </h2>
              {history.length > 0 ? (
                <button
                  type="button"
                  onClick={() => saveHistory([])}
                  className="text-[12px] text-muted underline decoration-rule underline-offset-4 hover:text-ink"
                >
                  Xoá
                </button>
              ) : null}
            </div>

            {history.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">
                Chưa có tìm kiếm nào.
              </p>
            ) : (
              <ul className="mt-1">
                {history.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => searchFor(term)}
                      className="flex w-full items-center gap-2 py-2 text-left text-[13px] hover:text-accent"
                    >
                      <IconSearch
                        className="h-3.5 w-3.5 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                      <span className="truncate">{term}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
