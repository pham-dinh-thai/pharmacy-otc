import { Module } from '@nestjs/common';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { ImageStorageService } from './application/image-storage.service';
import { UploadsController } from './presentation/uploads.controller';

@Module({
  imports: [SecurityModule],
  controllers: [UploadsController],
  providers: [ImageStorageService],
})
export class UploadsModule {}
