import {
  CategorySlugRequiredException,
  CategorySlugTooLongException,
} from '../exceptions/category.exceptions';

export const CATEGORY_SLUG_MAX_LENGTH = 255;

export class CategorySlug {
  private constructor(private readonly value: string) {}

  /** Dùng khi client không gửi slug: sinh slug từ tên danh mục. */
  public static fromName(name: string): CategorySlug {
    return CategorySlug.create(name);
  }

  public static create(value: string): CategorySlug {
    const slug = CategorySlug.normalize(value);

    if (!slug) throw new CategorySlugRequiredException();
    if (slug.length > CATEGORY_SLUG_MAX_LENGTH) {
      throw new CategorySlugTooLongException();
    }

    return new CategorySlug(slug);
  }

  public getValue(): string {
    return this.value;
  }

  private static normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, (character) => (character === 'đ' ? 'd' : 'D'))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
