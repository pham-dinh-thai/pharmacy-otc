'use client';

import { useState } from 'react';

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

/** Ô mật khẩu có nút hiện/ẩn, dùng được trong cả form server component. */
export function PasswordField({
  name,
  autoComplete,
  placeholder,
  required = false,
  minLength,
  maxLength,
}: {
  name: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className={`${INPUT_CLASS} pr-16`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-3 text-[12px] font-medium text-muted transition-colors hover:text-ink focus:outline-2 focus:outline-accent"
      >
        {visible ? 'Ẩn' : 'Hiện'}
      </button>
    </div>
  );
}
