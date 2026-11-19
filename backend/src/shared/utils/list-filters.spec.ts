import { describe, expect, it } from '@jest/globals';
import { type TransformFnParams } from 'class-transformer';
import { likePattern, parseTriStateFilter, trimToNull } from './list-filters';

const transform = (
  fn: (params: TransformFnParams) => unknown,
  value: unknown,
) => fn({ value } as TransformFnParams);

describe('list filters', () => {
  it('escapes LIKE wildcards and trims the search term', () => {
    expect(likePattern('  abc  ')).toBe('%abc%');
    expect(likePattern('50%_')).toBe('%50\\%\\_%');
    expect(likePattern('  ')).toBeUndefined();
  });

  it('turns blank strings into null so class-validator can skip them', () => {
    expect(transform(trimToNull, '  kho  ')).toBe('kho');
    expect(transform(trimToNull, '   ')).toBeNull();
    expect(transform(trimToNull, 5)).toBe(5);
  });

  it.each([
    [undefined, 'all'],
    ['', 'all'],
    ['ALL', 'all'],
    ['true', true],
    ['False', false],
    [true, true],
    ['yes', 'yes'],
  ])('parses tri-state %p as %p', (value, expected) => {
    expect(transform(parseTriStateFilter, value)).toBe(expected);
  });
});
