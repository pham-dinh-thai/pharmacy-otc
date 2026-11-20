import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  ProductAlreadyDeletedException,
  ProductNotDeletedException,
} from './exceptions/product.exceptions';
import { Product } from './product.aggregate';

const CATEGORY_ID_1 = '9b781a20-0ab6-494a-9bfd-e475e07c7a17';
const CATEGORY_ID_2 = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const createProduct = (): Product =>
  Product.create({
    name: 'Coffee',
    unitPrice: '12500',
  });

describe('Product', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a product with generated id and normalized values', () => {
    const product = createProduct();

    expect(product.getId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(product.getName()).toBe('Coffee');
    expect(product.getUnitPrice()).toBe('12500');
  });

  it('sets createdAt equal to updatedAt on creation', () => {
    const product = createProduct();

    expect(product.getCreatedAt()).toEqual(product.getUpdatedAt());
  });

  it('updates name and updatedAt', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const product = createProduct();
    const createdAt = product.getUpdatedAt();

    jest.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
    product.updateName('Tea');

    expect(product.getName()).toBe('Tea');
    expect(product.getUpdatedAt().getTime()).toBeGreaterThan(
      createdAt.getTime(),
    );
    expect(product.getCreatedAt()).toEqual(createdAt);
  });

  it('updates the unit price through its value object', () => {
    const product = createProduct();

    product.updateUnitPrice('99990');

    expect(product.getUnitPrice()).toBe('99990');
  });

  it('normalizes and deduplicates category ids on create', () => {
    const product = Product.create({
      name: 'Coffee',
      unitPrice: '12500',
      categoryIds: [CATEGORY_ID_1, ` ${CATEGORY_ID_1} `, CATEGORY_ID_2],
    });

    expect(product.getCategoryIds()).toEqual([CATEGORY_ID_1, CATEGORY_ID_2]);
  });

  it('keeps category ids when an update omits them and replaces them otherwise', () => {
    const product = Product.create({
      name: 'Coffee',
      unitPrice: '12500',
      categoryIds: [CATEGORY_ID_1],
    });

    product.update({ name: 'Tea', unitPrice: '5000' });
    expect(product.getCategoryIds()).toEqual([CATEGORY_ID_1]);

    product.update({
      name: 'Tea',
      unitPrice: '5000',
      categoryIds: [CATEGORY_ID_2, CATEGORY_ID_2],
    });
    expect(product.getCategoryIds()).toEqual([CATEGORY_ID_2]);
  });

  it('restores a product from persisted data with its soft-delete state and categories', () => {
    const deletedAt = new Date('2026-01-03T00:00:00.000Z');
    const product = Product.fromPersistent({
      id: 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c',
      name: 'Tea',
      unitPrice: '5000',
      categoryIds: [CATEGORY_ID_1],
      deletedAt,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(product.getId()).toBe('b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c');
    expect(product.getName()).toBe('Tea');
    expect(product.getUnitPrice()).toBe('5000');
    expect(product.getCategoryIds()).toEqual([CATEGORY_ID_1]);
    expect(product.getDeletedAt()).toEqual(deletedAt);
    expect(product.isDeleted()).toBe(true);
  });

  it('soft deletes and restores, rejecting repeated transitions', () => {
    const product = createProduct();

    product.softDelete();
    expect(product.isDeleted()).toBe(true);
    expect(() => product.softDelete()).toThrow(ProductAlreadyDeletedException);

    product.restore();
    expect(product.isDeleted()).toBe(false);
    expect(product.getDeletedAt()).toBeNull();
    expect(() => product.restore()).toThrow(ProductNotDeletedException);
  });
});
