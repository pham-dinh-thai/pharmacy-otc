import {
  CategoryNameRequiredException,
  CategoryNameTooLongException,
} from '../exceptions/category.exceptions';

export const CATEGORY_NAME_MAX_LENGTH = 255;

export class CategoryName {
  private constructor(private readonly value: string) {}

  public static create(value: string): CategoryName {
    const trimmed = value?.trim();

    if (!trimmed) throw new CategoryNameRequiredException();
    if (trimmed.length > CATEGORY_NAME_MAX_LENGTH) {
      throw new CategoryNameTooLongException();
    }

    return new CategoryName(trimmed);
  }

  public getValue(): string {
    return this.value;
  }
}
