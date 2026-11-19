import { describe, expect, it } from '@jest/globals';
import { CategoryName } from './category-name';
import { CategorySlug } from './category-slug';
import {
  CategoryNameRequiredException,
  CategoryNameTooLongException,
  CategorySlugRequiredException,
  CategorySlugTooLongException,
} from '../exceptions/category.exceptions';

describe('Category value objects', () => {
  it('trims and validates category names', () => {
    expect(CategoryName.create('  Thuốc OTC  ').getValue()).toBe('Thuốc OTC');
    expect(() => CategoryName.create('   ')).toThrow(
      CategoryNameRequiredException,
    );
    expect(() => CategoryName.create('a'.repeat(256))).toThrow(
      CategoryNameTooLongException,
    );
  });

  it('normalizes slugs to lowercase ascii and rejects invalid slugs', () => {
    expect(CategorySlug.create('  Đồ dùng / Y tế!  ').getValue()).toBe(
      'do-dung-y-te',
    );
    expect(CategorySlug.fromName('Thực phẩm chức năng').getValue()).toBe(
      'thuc-pham-chuc-nang',
    );
    expect(() => CategorySlug.create('---')).toThrow(
      CategorySlugRequiredException,
    );
    expect(() => CategorySlug.create('a'.repeat(256))).toThrow(
      CategorySlugTooLongException,
    );
  });
});
