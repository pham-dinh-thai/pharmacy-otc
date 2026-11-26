import type { OrderLine } from '@/lib/orders';

export function ProductThumb({ line }: { line: OrderLine }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-rule bg-surface text-[22px] font-semibold text-muted">
      {line.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={line.imageUrl}
          alt={line.productName}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{line.productName.slice(0, 1)}</span>
      )}
    </div>
  );
}
