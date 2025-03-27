import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from '../storage/minio.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageSize = 5 * 1024 * 1024; // 5MB

  constructor(private readonly minioService: MinioService) {}

  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    const uploadResult = await this.minioService.uploadFile(
      file.buffer,
      file.originalname,
      {
        maxSize: this.maxImageSize,
        allowedTypes: this.allowedImageTypes,
        contentType: file.mimetype,
      },
    );

    return uploadResult.url;
  }

  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      const imagePath = new URL(imageUrl).pathname.slice(1);
      await this.minioService.deleteFile(imagePath);
    } catch (error) {
      this.logger.warn(`Failed to delete image: ${error.message}`);
    }
  }

  async updateProductImage(oldImageUrl: string | null, newFile: Express.Multer.File): Promise<string> {
    // Delete old image if it exists
    if (oldImageUrl) {
      await this.deleteProductImage(oldImageUrl);
    }

    // Upload new image
    return this.uploadProductImage(newFile);
  }
}
