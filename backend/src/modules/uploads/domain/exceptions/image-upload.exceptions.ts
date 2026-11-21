import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class EmptyImageException extends DomainException {
  public constructor() {
    super('Image file is empty', 'EMPTY_IMAGE');
  }
}

export class UnsupportedImageFormatException extends DomainException {
  public constructor() {
    super(
      'Only JPG, PNG and WebP images are supported',
      'UNSUPPORTED_IMAGE_FORMAT',
    );
  }
}

export class ImageTooLargeException extends DomainException {
  public constructor() {
    super('Image file exceeds the 5 MB limit', 'IMAGE_TOO_LARGE');
  }
}

export class ImageHashMismatchException extends DomainException {
  public constructor() {
    super(
      'Image hash does not match the uploaded bytes',
      'IMAGE_HASH_MISMATCH',
    );
  }
}

export class ImageNotFoundException extends DomainException {
  public constructor() {
    super('Image file not found', 'IMAGE_NOT_FOUND');
  }
}
