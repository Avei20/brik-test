import {
  Controller,
  Logger,
  Post,
  Body,
  ParseIntPipe,
  Param,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDTO } from './dto/createProduct.dto';
import { Product } from './product.entity';
import { MinioService } from '../storage/minio.service';
import { FindAllDTO } from './dto/findAll.dto';
import { UpdateProductDTO } from './dto/updateProduct.dto';

@Controller('product')
export class ProductController {
  private logger: Logger = new Logger(ProductController.name);
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageSize = 5 * 1024 * 1024; // 5MB

  constructor(
    private readonly productService: ProductService,
    private readonly minioService: MinioService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() data: CreateProductDTO,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<Product> {
    let imageUrl: string | undefined;

    if (image) {
      // Validate file type
      if (!this.allowedImageTypes.includes(image.mimetype)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
        );
      }

      // Validate file size
      if (image.size > this.maxImageSize) {
        throw new BadRequestException(
          `File too large. Maximum size: ${this.maxImageSize / 1024 / 1024}MB`,
        );
      }

      const uploadResult = await this.minioService.uploadFile(
        image.buffer,
        image.originalname,
        {
          maxSize: this.maxImageSize,
          allowedTypes: this.allowedImageTypes,
          contentType: image.mimetype,
        },
      );
      imageUrl = uploadResult.url;
    }

    return this.productService.create({
      ...data,
      image: imageUrl,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProductDTO,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.productService.findOne(id);

    if (image) {
      // Validate file type
      if (!this.allowedImageTypes.includes(image.mimetype)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
        );
      }

      // Validate file size
      if (image.size > this.maxImageSize) {
        throw new BadRequestException(
          `File too large. Maximum size: ${this.maxImageSize / 1024 / 1024}MB`,
        );
      }

      // Delete old image if it exists
      if (product.image) {
        try {
          const oldImagePath = new URL(product.image).pathname.slice(1);
          await this.minioService.deleteFile(oldImagePath);
        } catch (error) {
          this.logger.warn(`Failed to delete old image: ${error.message}`);
        }
      }

      // Upload new image
      const uploadResult = await this.minioService.uploadFile(
        image.buffer,
        image.originalname,
        {
          maxSize: this.maxImageSize,
          allowedTypes: this.allowedImageTypes,
          contentType: image.mimetype,
        },
      );
      data.image = uploadResult.url;
    }

    return this.productService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const product = await this.productService.findOne(id);

    if (product.image) {
      try {
        const imagePath = new URL(product.image).pathname.slice(1);
        await this.minioService.deleteFile(imagePath);
      } catch (error) {
        this.logger.warn(`Failed to delete image: ${error.message}`);
      }
    }

    return this.productService.delete(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productService.findOne(id);
  }

  @Get()
  async findAll(@Query() query: FindAllDTO) {
    return this.productService.findAll(query);
  }
}
