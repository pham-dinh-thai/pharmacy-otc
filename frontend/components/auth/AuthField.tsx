export function AuthField({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  required = false,
  minLength,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-[13px] font-medium text-muted"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink"
      />
    </div>
  );
}
