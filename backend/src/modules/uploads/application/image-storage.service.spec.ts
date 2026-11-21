import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { createHash } from 'crypto';
import { mkdtemp, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  EmptyImageException,
  ImageHashMismatchException,
  ImageNotFoundException,
  ImageTooLargeException,
  UnsupportedImageFormatException,
} from '../domain/exceptions/image-upload.exceptions';
import { ImageStorageService, MAX_IMAGE_BYTES } from './image-storage.service';

const pngBytes = (suffix = 0) =>
  Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    suffix,
    0,
    0,
    0,
  ]);

const digest = (data: Buffer) =>
  createHash('sha256').update(data).digest('hex');

describe('ImageStorageService', () => {
  const previousDirectory = process.env.UPLOAD_DIR;
  let directory: string;
  let service: ImageStorageService;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'product-images-'));
    process.env.UPLOAD_DIR = directory;
    service = new ImageStorageService();
  });

  afterEach(async () => {
    if (previousDirectory === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = previousDirectory;
    }

    await rm(directory, { recursive: true, force: true });
  });

  it('stores bytes under their sha256 digest and returns a public URL', async () => {
    const image = pngBytes(1);

    const result = await service.store(image);

    expect(result).toEqual({
      hash: digest(image),
      url: `/api/uploads/images/${digest(image)}.png`,
      contentType: 'image/png',
      size: image.length,
    });
    expect(await readdir(directory)).toEqual([`${digest(image)}.png`]);
  });

  it('deduplicates identical bytes uploaded repeatedly', async () => {
    const first = await service.store(pngBytes(1));
    const second = await service.store(pngBytes(1));
    const third = await service.store(pngBytes(1));

    expect(first.url).toBe(second.url);
    expect(second.url).toBe(third.url);
    expect(await readdir(directory)).toHaveLength(1);
  });

  it('keeps different images as separate files', async () => {
    await service.store(pngBytes(1));
    await service.store(pngBytes(2));

    expect(await readdir(directory)).toHaveLength(2);
  });

  it('verifies a client supplied hash against the received bytes', async () => {
    const image = pngBytes(1);

    await expect(service.store(image, digest(image))).resolves.toMatchObject({
      hash: digest(image),
    });
    await expect(service.store(image, 'a'.repeat(64))).rejects.toThrow(
      ImageHashMismatchException,
    );
  });

  it('rejects empty, unsupported and oversized content', async () => {
    await expect(service.store(Buffer.alloc(0))).rejects.toThrow(
      EmptyImageException,
    );
    await expect(service.store(Buffer.from('hello'))).rejects.toThrow(
      UnsupportedImageFormatException,
    );
    await expect(
      service.store(Buffer.alloc(MAX_IMAGE_BYTES + 1)),
    ).rejects.toThrow(ImageTooLargeException);
  });

  it('opens a stored file with its detected content type', async () => {
    const image = pngBytes(1);
    const stored = await service.store(image);

    const opened = await service.open(`${stored.hash}.png`);

    expect(opened.contentType).toBe('image/png');
    expect(opened.size).toBe(image.length);
    opened.stream.destroy();
  });

  it('rejects unsafe or missing file references', async () => {
    await expect(service.open('../../etc/passwd')).rejects.toThrow(
      ImageNotFoundException,
    );
    await expect(service.open(`${'a'.repeat(64)}.png`)).rejects.toThrow(
      ImageNotFoundException,
    );
  });
});
