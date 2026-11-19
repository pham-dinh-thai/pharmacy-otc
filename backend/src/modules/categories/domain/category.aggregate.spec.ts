import { describe, expect, it } from '@jest/globals';
import { Category } from './category.aggregate';
import {
  CategoryAlreadyDeletedException,
  CategoryNotDeletedException,
} from './exceptions/category.exceptions';

const PRODUCT_ID_1 = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const PRODUCT_ID_2 = '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d';

describe('Category', () => {
  it('generates a slug from the Vietnamese name when none is provided', () => {
    const category = Category.create({
      name: '  Thuốc OTC & thực phẩm  ',
      description: '  Danh mục chính  ',
    });

    expect(category.getName()).toBe('Thuốc OTC & thực phẩm');
    expect(category.getSlug()).toBe('thuoc-otc-thuc-pham');
    expect(category.getDescription()).toBe('Danh mục chính');
    expect(category.getProductIds()).toEqual([]);
    expect(category.getDeletedAt()).toBeNull();
    expect(category.isDeleted()).toBe(false);
    expect(category.getCreatedAt()).toEqual(category.getUpdatedAt());
  });

  it('normalizes an explicit slug and deduplicates product ids', () => {
    const category = Category.create({
      name: 'Thực phẩm chức năng',
      slug: '  Thực phẩm/chức năng  ',
      productIds: [PRODUCT_ID_1, ` ${PRODUCT_ID_1} `, PRODUCT_ID_2],
    });

    expect(category.getSlug()).toBe('thuc-pham-chuc-nang');
    expect(category.getProductIds()).toEqual([PRODUCT_ID_1, PRODUCT_ID_2]);
  });

  it('restores timestamps and product ids from persistence', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const updatedAt = new Date('2026-02-01T00:00:00Z');
    const deletedAt = new Date('2026-02-02T00:00:00Z');

    const category = Category.fromPersistent({
      id: '9b781a20-0ab6-494a-9bfd-e475e07c7a17',
      name: 'Mỹ phẩm dược',
      slug: 'my-pham-duoc',
      description: null,
      productIds: [PRODUCT_ID_1],
      deletedAt,
      createdAt,
      updatedAt,
    });

    expect(category.getId()).toBe('9b781a20-0ab6-494a-9bfd-e475e07c7a17');
    expect(category.getProductIds()).toEqual([PRODUCT_ID_1]);
    expect(category.getDeletedAt()).toEqual(deletedAt);
    expect(category.isDeleted()).toBe(true);
    expect(category.getCreatedAt()).toEqual(createdAt);
    expect(category.getUpdatedAt()).toEqual(updatedAt);
  });

  it('keeps product ids on an update that does not provide them', () => {
    const category = Category.create({
      name: 'Thiết bị y tế',
      productIds: [PRODUCT_ID_1],
    });

    category.update({ name: 'Thiết bị y tế tại nhà' });

    expect(category.getName()).toBe('Thiết bị y tế tại nhà');
    expect(category.getSlug()).toBe('thiet-bi-y-te-tai-nha');
    expect(category.getProductIds()).toEqual([PRODUCT_ID_1]);
  });

  it('replaces product ids when an update provides them', () => {
    const category = Category.create({
      name: 'Danh mục',
      productIds: [PRODUCT_ID_1],
    });

    category.update({
      name: 'Danh mục',
      productIds: [PRODUCT_ID_2, PRODUCT_ID_2],
    });

    expect(category.getProductIds()).toEqual([PRODUCT_ID_2]);
  });

  it('soft deletes and restores, rejecting repeated transitions', () => {
    const category = Category.create({ name: 'Danh mục' });

    category.softDelete();
    expect(category.isDeleted()).toBe(true);
    expect(() => category.softDelete()).toThrow(
      CategoryAlreadyDeletedException,
    );

    category.restore();
    expect(category.isDeleted()).toBe(false);
    expect(() => category.restore()).toThrow(CategoryNotDeletedException);
  });
});
