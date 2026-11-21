import { Container } from '@/components/layout/Container';

export function CartSkeleton() {
  return (
    <Container className="py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <div>
          <div className="h-4 w-28 bg-surface" />
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="mt-6 flex gap-5 border-t border-rule pt-6"
            >
              <div className="h-24 w-24 shrink-0 bg-surface" />
              <div className="flex-1">
                <div className="h-4 w-2/3 bg-surface" />
                <div className="mt-2 h-3 w-1/3 bg-surface" />
                <div className="mt-6 h-8 w-28 bg-surface" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 border border-rule bg-surface/40" />
      </div>
    </Container>
  );
}
