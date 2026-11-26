import type { Order } from '../../../domain/order.aggregate';
import type { OrderCursor } from '../../../domain/orders.repository';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function encodeOrderCursor(order: Order): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: order.getCreatedAt().toISOString(),
      id: order.getId(),
    }),
  ).toString('base64url');
}

export function decodeOrderCursor(value: string): OrderCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );

    if (
      !isRecord(parsed) ||
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.id !== 'string'
    ) {
      return null;
    }

    const createdAt = new Date(parsed.createdAt);

    if (Number.isNaN(createdAt.getTime())) return null;

    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}
