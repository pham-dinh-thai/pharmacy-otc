export type ProductCategory =
  | 'otc_medicine'
  | 'supplement'
  | 'cosmetics'
  | 'medical_device';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: ProductCategory;
  categoryName: string;
  subCategory?: string;
  unit: string;
  unitPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  soldCount: number;
  prescriptionRequired: false;
  dosageForm: string;
  manufacturer: string;
  origin: string;
  imageUrl: string;
  shortDescription: string;
  description?: string;
  activeIngredient?: string;
  indications?: string[];
  usageWarning?: string;
  tags?: ('bestseller' | 'hotdeal' | 'pharmacist_pick' | 'new')[];
}

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  itemCount: number;
  popularSubcategories: string[];
  color: string;
}

export interface HealthArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  date: string;
  readTime: string;
  imageUrl: string;
  category: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
