/** Public storefront models returned by /api/storefront. */
export interface StorefrontProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface StorefrontCategory extends StorefrontProductCategory {
  description: string | null;
  productCount: number;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  unitPrice: number;
  imageUrl: string | null;
  description: string | null;
  warning: string | null;
  stockQuantity: number;
  inStock: boolean;
  categories: StorefrontProductCategory[];
}

export interface StorefrontProductPage {
  items: StorefrontProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface CartItem {
  product: StorefrontProduct;
  quantity: number;
  lineTotal: number;
}

export interface CartItemResponse {
  product: Omit<StorefrontProduct, 'unitPrice'> & { unitPrice: string };
  quantity: number;
  lineTotal: string;
}

export interface CartResponse {
  kind: 'guest' | 'user';
  items: CartItemResponse[];
  totalItems: number;
  subtotal: string;
  shippingFee: string;
  total: string;
}

export interface CheckoutLineResponse {
  productId: string;
  productName: string;
  productSku: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface CheckoutDetailResponse {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  amount: string;
  expiresAt: string;
  createdAt: string;
  lines: CheckoutLineResponse[];
}

export interface ConfirmCheckoutResponse {
  id: string;
  status: 'confirmed';
  orderId: string;
}
