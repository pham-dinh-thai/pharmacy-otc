import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ProductIdRequiredException } from '../../../shared/domain/exceptions/value-object.exceptions';
import {
  InvalidOrderLineQuantityException,
  InvalidOrderProductNameException,
} from './exceptions/order.exception';
import { OrderLine } from './order-line.entity';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const NOW = new Date('2026-11-25T10:00:00.000Z');
const UUID_V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const baseProps = {
  productId: PRODUCT_ID,
  productName: 'Paracetamol 500mg',
  productSku: ' sku-001 ',
  unitPrice: 25000n,
  quantity: 2,
};

describe('OrderLine', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a line with a UUID v7 id and normalized snapshots', () => {
    const line = OrderLine.create(baseProps);

    expect(line.getId()).toMatch(UUID_V7_REGEX);
    expect(line.getProductId()).toBe(PRODUCT_ID);
    expect(line.getProductName()).toBe('Paracetamol 500mg');
    expect(line.getProductSku()).toBe('SKU-001');
    expect(line.getUnitPrice()).toBe(25000n);
    expect(line.getQuantity()).toBe(2);
    expect(line.getTotal().toString()).toBe('50000');
  });

  it('normalizes a blank SKU to null', () => {
    const line = OrderLine.create({ ...baseProps, productSku: '   ' });

    expect(line.getProductSku()).toBeNull();
  });

  it('rejects a missing product id', () => {
    expect(() => OrderLine.create({ ...baseProps, productId: '  ' })).toThrow(
      ProductIdRequiredException,
    );
  });

  it('rejects an empty product name', () => {
    expect(() => OrderLine.create({ ...baseProps, productName: ' ' })).toThrow(
      InvalidOrderProductNameException,
    );
  });

  it('rejects a product name longer than 255 characters', () => {
    expect(() =>
      OrderLine.create({ ...baseProps, productName: 'a'.repeat(256) }),
    ).toThrow(InvalidOrderProductNameException);
  });

  it('rejects a zero quantity', () => {
    expect(() => OrderLine.create({ ...baseProps, quantity: 0 })).toThrow(
      InvalidOrderLineQuantityException,
    );
  });

  it('restores a line from persistence', () => {
    const id = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
    const line = OrderLine.fromPersistent({ ...baseProps, id });

    expect(line.getId()).toBe(id);
    expect(line.getProductName()).toBe('Paracetamol 500mg');
    expect(line.getProductSku()).toBe('SKU-001');
    expect(line.getTotal().toString()).toBe('50000');
  });
});
