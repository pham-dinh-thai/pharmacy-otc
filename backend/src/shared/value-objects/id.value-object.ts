import { InvalidIdException } from '../domain/exceptions/value-object.exceptions';
import { randomUUID } from 'crypto';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class Id {
  private constructor(private readonly value: string) {}

  public static generate(): Id {
    return new Id(randomUUID());
  }

  public static create(value: string): Id {
    const trimmed = value?.trim();

    if (!trimmed) {
      throw new InvalidIdException('Id is required');
    }

    if (!UUID_V4_REGEX.test(trimmed)) {
      throw new InvalidIdException(
        `Invalid Id: "${trimmed}" is not a valid UUID v4`,
      );
    }

    return new Id(trimmed);
  }

  public getValue(): string {
    return this.value;
  }
}
