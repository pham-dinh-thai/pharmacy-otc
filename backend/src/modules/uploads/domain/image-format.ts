export type ImageExtension = 'jpg' | 'png' | 'webp';

export type ImageFormat = {
  extension: ImageExtension;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
};

const JPEG_PREFIX = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_PREFIX = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export const IMAGE_FORMATS: Record<ImageExtension, ImageFormat> = {
  jpg: { extension: 'jpg', contentType: 'image/jpeg' },
  png: { extension: 'png', contentType: 'image/png' },
  webp: { extension: 'webp', contentType: 'image/webp' },
};

/** Detect the real format from magic bytes, never from the client filename. */
export function detectImageFormat(data: Buffer): ImageFormat | null {
  if (
    data.length >= JPEG_PREFIX.length &&
    data.subarray(0, 3).equals(JPEG_PREFIX)
  ) {
    return IMAGE_FORMATS.jpg;
  }

  if (
    data.length >= PNG_PREFIX.length &&
    data.subarray(0, 8).equals(PNG_PREFIX)
  ) {
    return IMAGE_FORMATS.png;
  }

  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return IMAGE_FORMATS.webp;
  }

  return null;
}

export function imageFormatByExtension(
  extension: string,
): ImageFormat | undefined {
  return IMAGE_FORMATS[extension as ImageExtension];
}
