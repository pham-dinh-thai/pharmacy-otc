import { describe, expect, it } from '@jest/globals';
import { detectImageFormat, imageFormatByExtension } from './image-format';

const pngBytes = () =>
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

const webpBytes = () => {
  const bytes = Buffer.alloc(12);

  bytes.write('RIFF', 0, 'ascii');
  bytes.write('WEBP', 8, 'ascii');

  return bytes;
};

describe('detectImageFormat', () => {
  it('detects JPEG, PNG and WebP from magic bytes', () => {
    expect(detectImageFormat(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toEqual({
      extension: 'jpg',
      contentType: 'image/jpeg',
    });
    expect(detectImageFormat(pngBytes())).toEqual({
      extension: 'png',
      contentType: 'image/png',
    });
    expect(detectImageFormat(webpBytes())).toEqual({
      extension: 'webp',
      contentType: 'image/webp',
    });
  });

  it('rejects unknown or truncated content', () => {
    expect(detectImageFormat(Buffer.from('not an image'))).toBeNull();
    expect(detectImageFormat(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectImageFormat(Buffer.alloc(0))).toBeNull();
  });
});

describe('imageFormatByExtension', () => {
  it('only resolves whitelisted extensions', () => {
    expect(imageFormatByExtension('png')?.contentType).toBe('image/png');
    expect(imageFormatByExtension('gif')).toBeUndefined();
    expect(imageFormatByExtension('../../etc/passwd')).toBeUndefined();
  });
});
