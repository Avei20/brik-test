import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { CreateProductDTO } from './dto/createProduct.dto';
import { Product, Category } from './product.entity';
import { ProductService } from './product.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductController', () => {
  let controller: ProductController;
  let mockProductService: Partial<ProductService>;

  beforeEach(async () => {
    mockProductService = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
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
        image: 'http://example.com/ctrl.jpg',
        harga: 6000,
        categoryId: 2,
      };

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
        image: createDto.image,
        harga: createDto.harga,
        category: { id: createDto.categoryId } as Category, // Cast needed if Category props aren't fully mocked
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
        // products: [] // If Category entity was fully mocked
      };

      // Configure the mock service's create method
      (mockProductService.create as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      // Act
      const result = await controller.create(createDto);

      // Assert
      // Check if the service method was called correctly
      expect(mockProductService.create).toHaveBeenCalledTimes(1);
      expect(mockProductService.create).toHaveBeenCalledWith(createDto);

      // Check if the controller returned the result from the service
      expect(result).toEqual(expectedProduct);
    });
  });

  describe('findOne', () => {
    it('should call ProductService.findOne with the correct id and return the result', async () => {
      const productId = 1;
      const expectedProduct: Product = {
        name: 'Test Ciki From Controller',
        description: 'Super yummy',
        sku: 'CTRLSKU456',
        weight: 150,
        width: 12,
        length: 18,
        height: 6,
        image: 'http://example.com/ctrl.jpg',
        harga: 6000,
        category: { id: 2 } as Category,
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
      } as Product;

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
