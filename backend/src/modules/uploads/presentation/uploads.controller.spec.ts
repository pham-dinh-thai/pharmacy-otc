import { describe, expect, it, jest } from '@jest/globals';
import { type Request, type Response } from 'express';
import { Readable, PassThrough } from 'stream';
import { finished } from 'stream/promises';
import {
  ImageStorageService,
  MAX_IMAGE_BYTES,
  type StoredImage,
} from '../application/image-storage.service';
import { ImageTooLargeException } from '../domain/exceptions/image-upload.exceptions';
import { UploadsController } from './uploads.controller';

const pngBytes = () =>
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 0]);

const stored: StoredImage = {
  hash: 'a'.repeat(64),
  url: `/api/uploads/images/${'a'.repeat(64)}.png`,
  contentType: 'image/png',
  size: pngBytes().length,
};

const setup = () => {
  const store = jest
    .fn<ImageStorageService['store']>()
    .mockResolvedValue(stored);
  const open = jest.fn<ImageStorageService['open']>().mockResolvedValue({
    stream: Readable.from([pngBytes()]),
    contentType: 'image/png',
    size: pngBytes().length,
  });
  const controller = new UploadsController({
    store,
    open,
  } as unknown as ImageStorageService);

  return { controller, store, open };
};

describe('UploadsController', () => {
  it('streams the received bytes to the storage service', async () => {
    const { controller, store } = setup();
    const image = pngBytes();

    const result = await controller.upload(
      Readable.from([image]) as unknown as Request,
    );

    expect(result).toBe(stored);
    expect(store).toHaveBeenCalledWith(image, null);
  });

  it('forwards a client supplied hash for verification', async () => {
    const { controller, store } = setup();
    const hash = 'b'.repeat(64);

    await controller.upload(
      Readable.from([pngBytes()]) as unknown as Request,
      hash,
    );

    expect(store).toHaveBeenCalledWith(expect.any(Buffer), hash);
  });

  it('refuses bodies larger than the image limit before storing', async () => {
    const { controller, store } = setup();

    await expect(
      controller.upload(
        Readable.from([
          Buffer.alloc(MAX_IMAGE_BYTES + 1),
        ]) as unknown as Request,
      ),
    ).rejects.toThrow(ImageTooLargeException);
    expect(store).not.toHaveBeenCalled();
  });

  it('serves a stored image with cache headers', async () => {
    const { controller, open } = setup();
    const response = new PassThrough() as PassThrough & {
      setHeader: ReturnType<typeof jest.fn>;
    };
    response.setHeader = jest.fn();
    response.resume();

    await controller.download(
      `${'a'.repeat(64)}.png`,
      response as unknown as Response,
    );
    await finished(response);

    expect(open).toHaveBeenCalledWith(`${'a'.repeat(64)}.png`);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'image/png',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    );
  });
});
