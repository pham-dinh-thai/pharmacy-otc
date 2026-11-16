import { CATEGORIES, MOCK_PRODUCTS } from './mock-data';

/** Danh mục kèm số sản phẩm thật đang có trong danh mục. */
export const SEARCH_CATEGORIES = CATEGORIES.map((category) => ({
  id: category.id,
  name: category.name,
  count: MOCK_PRODUCTS.filter((product) => product.category === category.id)
    .length,
}));

/** Từ khoá lấy từ tên sản phẩm và hoạt chất có trong danh mục. */
export const SEARCH_KEYWORDS = [
  'Paracetamol',
  'Berberin',
  'Men vi sinh',
  'Nước biển sâu',
  'Kem chống nắng',
  'Omega-3',
  'Máy đo huyết áp',
  'Nhiệt kế',
];
