import { InvalidIdException } from '../domain/exceptions/value-object.exceptions';
import { Id } from './id.value-object';

const UUID_V4 = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const UUID_V7 = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const UUID_V1 = '9f7a1c3e-2b4d-11ef-8f0e-1c2d3e4f5a6b';

describe('Id', () => {
  describe('generate', () => {
    it('still generates a UUID v4 for backward compatibility', () => {
      const id = Id.generate();

      expect(id.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(id.getFormat()).toBe('uuid');
    });

    it('generates distinct ids', () => {
      expect(Id.generate().getValue()).not.toBe(Id.generate().getValue());
    });
  });

  describe('generateV7', () => {
    it('encodes the timestamp prefix and uses version 7', () => {
      const now = new Date('2026-11-23T10:20:30.456Z');
      const id = Id.generateV7(now);

      expect(id.getValue().replace(/-/g, '').slice(0, 12)).toBe(
        BigInt(now.getTime()).toString(16).padStart(12, '0'),
      );
      expect(id.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(id.getFormat()).toBe('uuid');
    });

    it('sorts lexicographically by creation time', () => {
      const earlier = Id.generateV7(new Date('2026-11-23T10:20:30.000Z'));
      const later = Id.generateV7(new Date('2026-11-23T10:20:31.000Z'));

      expect(earlier.getValue() < later.getValue()).toBe(true);
    });

    it('rejects an invalid timestamp', () => {
      expect(() => Id.generateV7(-1)).toThrow(InvalidIdException);
    });
  });

  describe('create', () => {
    it.each([UUID_V4, UUID_V7, UUID_V1])('accepts uuid %s', (raw) => {
      const id = Id.create(raw);

      expect(id.getValue()).toBe(raw);
      expect(id.isUuid()).toBe(true);
    });

    it('accepts a compact uuid and restores the dashes', () => {
      const id = Id.create('01931f7a1c3e7a618f0e1c2d3e4f5a6b');

      expect(id.getValue()).toBe(UUID_V7);
      expect(id.getFormat()).toBe('uuid');
    });

    it.each([
      ['123', '123'],
      ['000123', '123'],
      [42, '42'],
      [42n, '42'],
    ])('accepts sequence id %s', (raw, expected) => {
      const id = Id.create(raw);

      expect(id.getValue()).toBe(expected);
      expect(id.isSequence()).toBe(true);
    });

    it.each([
      '',
      '   ',
      'abc',
      '12.5',
      '-1',
      '0',
      '00000000-0000-0000-0000-000000000000',
    ])('rejects %s', (raw) => {
      expect(() => Id.create(raw)).toThrow(InvalidIdException);
    });

    it('rejects a compact uuid with an unsupported version', () => {
      expect(() => Id.create('00000000000000000000000000000000')).toThrow(
        InvalidIdException,
      );
    });
  });

  describe('conversions', () => {
    it('serializes to the canonical string', () => {
      expect(JSON.stringify({ id: Id.create(UUID_V7) })).toBe(
        `{"id":"${UUID_V7}"}`,
      );
    });

    it('converts a sequence id to bigint', () => {
      expect(Id.fromSequence('9007199254740993').toBigInt()).toBe(
        9007199254740993n,
      );
    });

    it('does not convert a uuid id to bigint', () => {
      expect(() => Id.create(UUID_V4).toBigInt()).toThrow(
        'UUID id can not be converted to bigint',
      );
    });
  });
});
