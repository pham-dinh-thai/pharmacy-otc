export function FormMessage({
  message,
  tone = 'error',
}: {
  message?: string;
  tone?: 'error' | 'success';
}) {
  if (!message) return null;

  const className =
    tone === 'error'
      ? 'border-red-600 bg-red-50 text-red-700'
      : 'border-accent bg-accent-soft text-accent';

  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mb-6 border-l-2 px-3 py-2 text-[13px] leading-5 ${className}`}
    >
      {message}
    </p>
  );
}
