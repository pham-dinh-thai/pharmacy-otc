import type { Order, OrderDetail, OrderLine } from './orders';
import { fetchStorefrontProduct } from './storefront';

async function loadImages(lines: OrderLine[]): Promise<Map<string, string | null>> {
  const productIds = [...new Set(lines.map((line) => line.productId))];
  const products = await Promise.all(
    productIds.map((id) =>
      fetchStorefrontProduct(id).catch(() => null),
    ),
  );

  return new Map(
    productIds.map((id, index) => [id, products[index]?.imageUrl ?? null]),
  );
}

function applyImages<T extends { lines: OrderLine[] }>(
  entry: T,
  images: Map<string, string | null>,
): T {
  return {
    ...entry,
    lines: entry.lines.map((line) => ({
      ...line,
      imageUrl: images.get(line.productId) ?? null,
    })),
  };
}

export async function withOrderListThumbnails(
  orders: Order[],
): Promise<Order[]> {
  const images = await loadImages(orders.flatMap((order) => order.lines));

  return orders.map((order) => applyImages(order, images));
}

export async function withOrderDetailThumbnails(
  order: OrderDetail,
): Promise<OrderDetail> {
  const images = await loadImages(order.lines);

  return applyImages(order, images);
}
