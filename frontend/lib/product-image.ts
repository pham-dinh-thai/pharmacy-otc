export const PRODUCT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_HINT =
  'JPG, PNG hoặc WebP, tối đa 5 MB. Cùng một ảnh sẽ chỉ lưu một lần trên máy chủ.';

export const ALLOWED_PRODUCT_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
