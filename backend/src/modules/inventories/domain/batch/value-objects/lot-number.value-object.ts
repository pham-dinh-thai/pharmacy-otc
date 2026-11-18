import { InvalidLotNumberException } from '../../../../../shared/domain/exceptions/value-object.exceptions';

export class LotNumber {
  private static readonly MAX_LENGTH = 50;

  private constructor(private readonly value: string) {}

  public static create(raw: string): LotNumber {
    const trimmed = raw?.trim();

    if (!trimmed) {
      throw new InvalidLotNumberException('Lot number is required');
    }

    if (trimmed.length > LotNumber.MAX_LENGTH) {
      throw new InvalidLotNumberException('Lot number is too long');
    }

    return new LotNumber(trimmed);
  }

  public getValue(): string {
    return this.value;
  }
}
