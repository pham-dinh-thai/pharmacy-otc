'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  addToCartAction,
  clearCartAction,
  fetchCartAction,
  removeFromCartAction,
  setCartQuantityAction,
} from '@/lib/cart-actions';
import { MAX_CART_ITEMS } from '@/lib/cart';
import type { CartItem, CartResponse, StorefrontProduct } from '@/types';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  canAddMore: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: StorefrontProduct, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function toItems(cart: CartResponse): CartItem[] {
  return cart.items.map((item) => ({
    product: { ...item.product, unitPrice: Number(item.product.unitPrice) },
    quantity: item.quantity,
    lineTotal: Number(item.lineTotal),
  }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState({
    totalItems: 0,
    subtotal: 0,
    shippingFee: 0,
    total: 0,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((cart: CartResponse) => {
    setItems(toItems(cart));
    setTotals({
      totalItems: cart.totalItems,
      subtotal: Number(cart.subtotal),
      shippingFee: Number(cart.shippingFee),
      total: Number(cart.total),
    });
    setError(null);
  }, []);

  const run = useCallback(
    async (action: () => Promise<CartResponse>) => {
      try {
        apply(await action());
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Không cập nhật được giỏ hàng.',
        );
      }
    },
    [apply],
  );

  useEffect(() => {
    let active = true;

    fetchCartAction()
      .then((cart) => {
        if (active) apply(cart);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : 'Không tải được giỏ hàng.',
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apply]);

  const addToCart = useCallback(
    async (product: StorefrontProduct, quantity = 1) => {
      await run(() => addToCartAction(product.id, quantity));
      setIsOpen(true);
    },
    [run],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      await run(() => removeFromCartAction(productId));
    },
    [run],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      await run(() => setCartQuantityAction(productId, quantity));
    },
    [run],
  );

  const clearCart = useCallback(async () => {
    await run(() => clearCartAction());
  }, [run]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        isLoading,
        error,
        canAddMore: totals.totalItems < MAX_CART_ITEMS,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems: totals.totalItems,
        subtotal: totals.subtotal,
        shippingFee: totals.shippingFee,
        total: totals.total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
