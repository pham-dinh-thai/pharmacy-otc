import { createHash, randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, rename, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import type { Readable } from 'stream';
import { Injectable } from '@nestjs/common';
import {
  detectImageFormat,
  imageFormatByExtension,
} from '../domain/image-format';
import {
  EmptyImageException,
  ImageHashMismatchException,
  ImageNotFoundException,
  ImageTooLargeException,
  UnsupportedImageFormatException,
} from '../domain/exceptions/image-upload.exceptions';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const FILE_PATTERN = /^([a-f0-9]{64})\.(jpg|png|webp)$/;

export type StoredImage = {
  hash: string;
  url: string;
  contentType: string;
  size: number;
};

export type ReadableImage = {
  stream: Readable;
  contentType: string;
  size: number;
};

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

/**
 * Stores images under their SHA-256 digest. The digest is computed from the
 * bytes actually received, so uploading the same image ten times produces one
 * file on disk and one URL returned to the client.
 */
@Injectable()
export class ImageStorageService {
  private readonly directory =
    process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads', 'images');

  public async store(
    data: Buffer,
    expectedHash?: string | null,
  ): Promise<StoredImage> {
    if (data.length === 0) {
      throw new EmptyImageException();
    }
    if (data.length > MAX_IMAGE_BYTES) {
      throw new ImageTooLargeException();
    }

    const format = detectImageFormat(data);

    if (!format) {
      throw new UnsupportedImageFormatException();
    }

    const hash = createHash('sha256').update(data).digest('hex');

    if (expectedHash && expectedHash !== hash) {
      throw new ImageHashMismatchException();
    }

    const fileName = `${hash}.${format.extension}`;
    const target = this.resolvePath(fileName);

    if (!(await this.exists(target))) {
      await mkdir(this.directory, { recursive: true });

      const temporary = `${target}.${randomUUID()}.tmp`;

      try {
        await writeFile(temporary, data);
        // rename is atomic on the same filesystem; a concurrent writer with
        // the same digest simply replaces the file with identical bytes.
        await rename(temporary, target);
      } catch (error) {
        await unlink(temporary).catch(() => undefined);
        throw error;
      }
    }

    return {
      hash,
      url: `/api/uploads/images/${fileName}`,
      contentType: format.contentType,
      size: data.length,
    };
  }

  public async open(file: string): Promise<ReadableImage> {
    const match = FILE_PATTERN.exec(file);
    const format = match ? imageFormatByExtension(match[2]) : undefined;

    if (!match || !format) {
      throw new ImageNotFoundException();
    }

    const path = this.resolvePath(file);

    try {
      const stats = await stat(path);

      return {
        stream: createReadStream(path),
        contentType: format.contentType,
        size: stats.size,
      };
    } catch (error) {
      if (isMissingFile(error)) {
        throw new ImageNotFoundException();
      }

      throw error;
    }
  }

  private resolvePath(fileName: string): string {
    return join(this.directory, fileName);
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch (error) {
      if (isMissingFile(error)) {
        return false;
      }

      throw error;
    }
  }
}
