import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { CreateProductDTO } from './dto/createProduct.dto';
import { Product, Category } from './product.entity';
import { ProductService } from './product.service';
import { MinioService } from '../storage/minio.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductController', () => {
  let controller: ProductController;
  let mockProductService: Partial<ProductService>;
  let mockMinioService: Partial<MinioService>;

  beforeEach(async () => {
    mockProductService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockMinioService = {
      uploadFile: jest.fn().mockResolvedValue({
        url: 'http://example.com/ctrl.jpg',
        path: 'products/ctrl.jpg',
      }),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: MinioService,
          useValue: mockMinioService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call ProductService.create with the correct DTO and return the result', async () => {
      const createDto: CreateProductDTO = {
        name: 'Test Ciki From Controller',
        description: 'Super yummy',
        sku: 'CTRLSKU456',
        weight: 150,
        width: 12,
        length: 18,
        height: 6,
        harga: 6000,
        categoryId: 2,
      };

      // Mock file upload
      const mockFile = {
        buffer: Buffer.from('test image content'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const expectedProduct: Product = {
        // Simulate the product object returned by the service
        id: 101,
        sku: createDto.sku,
        name: createDto.name,
        description: createDto.description,
        weight: createDto.weight,
        width: createDto.width,
        length: createDto.length,
        height: createDto.height,
        image: 'http://example.com/ctrl.jpg', // This should match the URL from MinioService mock
        harga: createDto.harga,
        category: { id: createDto.categoryId } as Category,
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
      };

      // Configure the mock service's create method
      (mockProductService.create as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      // Act - Pass the file separately as it would be in the actual controller
      const result = await controller.create(createDto, mockFile);

      // Assert
      // The controller should have called MinioService.uploadFile
      expect(mockMinioService.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname,
        expect.objectContaining({
          contentType: mockFile.mimetype,
        }),
      );

      // The controller should have called ProductService.create with the DTO + image URL
      expect(mockProductService.create).toHaveBeenCalledTimes(1);
      expect(mockProductService.create).toHaveBeenCalledWith({
        ...createDto,
        image: 'http://example.com/ctrl.jpg', // This should match the URL from MinioService mock
      });

      // Check if the controller returned the result from the service
      expect(result).toEqual(expectedProduct);
    });
  });

  describe('findOne', () => {
    it('should call ProductService.findOne with the correct id and return the result', async () => {
      const productId = 1;
      const expectedProduct: Product = {
        id: productId,
        sku: 'SKU123',
        name: 'Test Product',
        description: 'Test Description',
        weight: 100,
        width: 10,
        length: 15,
        height: 5,
        image: 'http://example.com/image.jpg',
        harga: 5000,
        category: { id: 1 } as Category,
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
      };

      (mockProductService.findOne as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      const result = await controller.findOne(productId);

      expect(mockProductService.findOne).toHaveBeenCalledTimes(1);
      expect(mockProductService.findOne).toHaveBeenCalledWith(productId);
      expect(result).toEqual(expectedProduct);
    });

    it('should re-throw NotFoundException if service throws it', async () => {
      const productId = 99;
      const serviceError = new NotFoundException(
        `Product with ID ${productId} not found`,
      );

      (mockProductService.findOne as jest.Mock).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.findOne(productId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne(productId)).rejects.toThrow(
        `Product with ID ${productId} not found`,
      );
      expect(mockProductService.findOne).toHaveBeenCalledWith(productId);
    });
  });
});
