import { describe, expect, it } from '@jest/globals';
import type { Order } from '../../../domain/order.aggregate';
import { decodeOrderCursor, encodeOrderCursor } from './order.cursor';

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';

const order = {
  getCreatedAt: () => CREATED_AT,
  getId: () => ORDER_ID,
} as Order;

describe('order cursor', () => {
  it('round trips the createdAt and id keyset', () => {
    const cursor = encodeOrderCursor(order);

    expect(decodeOrderCursor(cursor)).toEqual({
      createdAt: CREATED_AT,
      id: ORDER_ID,
    });
  });

  it('rejects malformed cursors', () => {
    expect(decodeOrderCursor('not-a-cursor')).toBeNull();
    expect(
      decodeOrderCursor(
        Buffer.from(
          JSON.stringify({ createdAt: 'invalid', id: ORDER_ID }),
        ).toString('base64url'),
      ),
    ).toBeNull();
  });
});
