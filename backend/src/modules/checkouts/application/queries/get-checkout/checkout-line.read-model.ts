export class CheckoutLineReadModel {
  public constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly productSku: string | null,
    public readonly unitPrice: string,
    public readonly quantity: number,
    public readonly lineTotal: string,
  ) {}
}
