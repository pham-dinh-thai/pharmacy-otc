import { type TransformFnParams } from 'class-transformer';

/** Giá trị filter có 3 trạng thái: tất cả / chỉ hoạt động / chỉ không hoạt động. */
export type TriStateFilter = boolean | 'all';

export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');

export const likePattern = (value: string | undefined): string | undefined => {
  const search = value?.trim();

  return search ? `%${escapeLikePattern(search)}%` : undefined;
};

export const trimToNull = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
};

/** `all` (mặc định) hoặc `true`/`false` từ query string. */
export const parseTriStateFilter = ({ value }: TransformFnParams): unknown => {
  if (value === undefined || value === null || value === '') return 'all';
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();

  if (normalized === 'all') return 'all';
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  return value;
};
