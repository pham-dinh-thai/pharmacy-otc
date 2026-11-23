import { InvalidIdException } from '../domain/exceptions/value-object.exceptions';
import { randomBytes, randomUUID } from 'crypto';

export type IdFormat = 'uuid' | 'sequence';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMPACT_UUID_REGEX = /^[0-9a-f]{32}$/i;
const SEQUENCE_REGEX = /^\d+$/;

const normalizeUuid = (raw: string): string | null => {
  if (UUID_REGEX.test(raw)) {
    return raw;
  }

  if (!COMPACT_UUID_REGEX.test(raw)) {
    return null;
  }

  const dashed = `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(
    12,
    16,
  )}-${raw.slice(16, 20)}-${raw.slice(20)}`;

  return UUID_REGEX.test(dashed) ? dashed : null;
};

export class Id {
  private constructor(
    private readonly value: string,
    private readonly format: IdFormat,
  ) {}

  /** Keeps generating UUID v4 so existing modules are unaffected. */
  public static generate(): Id {
    return Id.generateV4();
  }

  public static generateV4(): Id {
    return new Id(randomUUID(), 'uuid');
  }

  public static generateV7(now: Date | number = new Date()): Id {
    const timestamp = now instanceof Date ? now.getTime() : now;

    if (!Number.isInteger(timestamp) || timestamp < 0) {
      throw new InvalidIdException('Invalid timestamp for UUID v7');
    }

    const bytes = randomBytes(16);
    const ms = BigInt(timestamp);

    for (let shift = 40, index = 0; index < 6; shift -= 8, index += 1) {
      bytes[index] = Number((ms >> BigInt(shift)) & 0xffn);
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString('hex');

    return new Id(
      `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
        16,
        20,
      )}-${hex.slice(20)}`,
      'uuid',
    );
  }

  public static fromSequence(value: string | number | bigint): Id {
    let sequence: bigint;

    try {
      sequence = BigInt(value);
    } catch {
      throw new InvalidIdException(`Invalid sequence id: "${String(value)}"`);
    }

    if (sequence <= 0n) {
      throw new InvalidIdException('Sequence id must be a positive integer');
    }

    return new Id(sequence.toString(), 'sequence');
  }

  public static create(value: string | number | bigint): Id {
    if (typeof value === 'number' || typeof value === 'bigint') {
      return Id.fromSequence(value);
    }

    const trimmed = value?.trim();

    if (!trimmed) {
      throw new InvalidIdException('Id is required');
    }

    if (SEQUENCE_REGEX.test(trimmed)) {
      return Id.fromSequence(trimmed);
    }

    const uuid = normalizeUuid(trimmed);

    if (uuid) {
      return new Id(uuid, 'uuid');
    }

    throw new InvalidIdException(
      `Invalid Id: "${trimmed}" is not a valid UUID or sequence id`,
    );
  }

  public getValue(): string {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }

  public toJSON(): string {
    return this.value;
  }

  public getFormat(): IdFormat {
    return this.format;
  }

  public isUuid(): boolean {
    return this.format === 'uuid';
  }

  public isSequence(): boolean {
    return this.format === 'sequence';
  }

  public toBigInt(): bigint {
    if (!this.isSequence()) {
      throw new InvalidIdException('UUID id can not be converted to bigint');
    }

    return BigInt(this.value);
  }
}
