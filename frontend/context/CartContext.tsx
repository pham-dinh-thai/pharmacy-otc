'use client';

import React, { createContext, useContext, useState } from 'react';
import { CartItem, StorefrontProduct } from '@/types';

const CART_KEY = 'pharma_cart_v2';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: StorefrontProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  const addToCart = (product: StorefrontProduct, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        updated = [...prev, { product, quantity }];
      }
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId: string) => {
    const updated = items.filter((item) => item.product.id !== productId);
    saveItems(updated);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item,
    );
    saveItems(updated);
  };

  const clearCart = () => {
    saveItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity,
    0,
  );
  // Free delivery for orders >= 250,000 VND
  const shippingFee = subtotal >= 250000 || subtotal === 0 ? 0 : 25000;
  const total = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shippingFee,
        total,
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
