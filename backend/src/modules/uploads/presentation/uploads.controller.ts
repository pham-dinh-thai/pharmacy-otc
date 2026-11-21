import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { AuthGuard } from '../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../shared/modules/security/require-permissions.decorator';
import {
  ImageStorageService,
  MAX_IMAGE_BYTES,
  type StoredImage,
} from '../application/image-storage.service';
import { ImageTooLargeException } from '../domain/exceptions/image-upload.exceptions';

@Controller('uploads/images')
export class UploadsController {
  public constructor(private readonly storage: ImageStorageService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions(['products:create', 'products:update'])
  public async upload(
    @Req() request: Request,
    @Headers('x-image-hash') expectedHash?: string,
  ): Promise<StoredImage> {
    const data = await this.readBody(request);

    return this.storage.store(data, expectedHash ?? null);
  }

  @Get(':file')
  public async download(
    @Param('file') file: string,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.storage.open(file);

    response.setHeader('Content-Type', image.contentType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Content-Length', image.size);
    image.stream.on('error', () => response.destroy());
    image.stream.pipe(response);
  }

  private async readBody(request: Request): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let size = 0;

    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk as Uint8Array);

      size += buffer.length;

      if (size > MAX_IMAGE_BYTES) {
        throw new ImageTooLargeException();
      }

      chunks.push(buffer);
    }

    return Buffer.concat(chunks);
  }
}
