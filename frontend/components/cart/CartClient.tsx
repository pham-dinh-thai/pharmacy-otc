'use client';

import dynamic from 'next/dynamic';
import { CartSkeleton } from './CartSkeleton';

const CartPanel = dynamic(
  () => import('./CartPanel').then((module) => module.CartPanel),
  { ssr: false, loading: () => <CartSkeleton /> },
);

export function CartClient() {
  return <CartPanel />;
}
