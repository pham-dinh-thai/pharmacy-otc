'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export function CartSync() {
  const { refreshCart } = useCart();

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  return null;
}
