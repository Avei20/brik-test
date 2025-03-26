import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { Category, Product } from './product.entity';
import { CreateProductDTO } from './dto/createProduct.dto';
import { UpdateProductDTO } from './dto/updateProduct.dto';
import { NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../auditLog/auditLog.service';
import { Action } from '../auditLog/auditLog.entity';

beforeEach(() => {
  jest.clearAllMocks();
});
describe('ProductService', () => {
  let service: ProductService;
  let productRepository: Repository<Product>;
  let auditLogService: AuditLogService;

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description 1',
      sku: 'SKU1',
      harga: 100,
      weight: 1,
      width: 1,
      length: 1,
      height: 1,
      image: 'image1.jpg',
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
      category: {
        id: 1,
        name: 'Category 1',
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
        products: [],
      },
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description 2',
      sku: 'SKU2',
      harga: 200,
      weight: 2,
      width: 2,
      length: 2,
      height: 2,
      image: 'image2.jpg',
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
      category: {
        id: 2,
        name: 'Category 2',
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
        products: [],
      },
    },
  ];

  const mockProductRepository = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      category: { id: dto.categoryId },
    })),
    save: jest
      .fn()
      .mockImplementation((product) =>
        Promise.resolve({ id: Date.now(), ...product }),
      ),
    findOne: jest
      .fn()
      .mockImplementation((id) =>
        Promise.resolve(mockProducts.find((p) => p.id === id)),
      ),
    findOneOrFail: jest.fn().mockImplementation((id) => {
      const product = mockProducts.find((p) => p.id === id);
      if (!product) {
        return Promise.reject(new EntityNotFoundError(Product, id));
      }
      return Promise.resolve(product);
    }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    preload: jest.fn().mockImplementation((updateData) => {
      const existingProduct = mockProducts.find((p) => p.id === updateData.id);
      if (!existingProduct) {
        return undefined;
      }
      return Promise.resolve({ ...existingProduct, ...updateData });
    }),
  };

  const mockAuditLogService = {
    createLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should correctly call repository create and save, and return the saved product', async () => {
      const createProductDTO: CreateProductDTO = {
        name: 'Test Ciki',
        description: 'Super yummy ciki ciki ala kabom',
        sku: 'TESTSKU123',
        weight: 200,
        width: 10,
        height: 5,
        length: 15,
        image: 'http://example.com/image.jpg',
        harga: 24444,
        categoryId: 1,
      };

      const mockCreatedProduct = {
        ...(({ categoryId, ...rest }) => rest)(createProductDTO),
        category: { id: createProductDTO.categoryId },
      };

      const mockSavedProduct = {
        id: expect.any(Number),
        ...mockCreatedProduct,
        updatedAt: new Date(),
        isDeleted: false,
        category: {
          id: 1,
          name: 'Category 1',
          updatedAt: new Date(),
          deletedAt: null,
          isDeleted: false,
          products: [],
        },
      };

      (mockProductRepository.save as jest.Mock).mockResolvedValue(
        mockSavedProduct,
      );

      const result = await service.create(createProductDTO);

      expect(mockProductRepository.create).toHaveBeenCalledTimes(1);
      expect(mockProductRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createProductDTO,
          category: { id: createProductDTO.categoryId },
        }),
      );

      expect(auditLogService.createLog).toHaveBeenCalledWith(
        Product.name,
        expect.any(Number),
        Action.CREATE,
        null,
        expect.objectContaining(mockSavedProduct),
      );

      expect(mockProductRepository.save).toHaveBeenCalledTimes(1);
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(mockCreatedProduct),
      );

      expect(result).toEqual(expect.objectContaining(mockSavedProduct));
    });
  });

  describe('update', () => {
    it('should update a product and log the update', async () => {
      const productId = 1;
      const updateProductDTO: UpdateProductDTO = {
        name: 'Updated Product',
        description: 'Updated Description',
      };

      const existingProduct = mockProducts.find((p) => p.id === productId);
      const updatedProduct = { ...existingProduct, ...updateProductDTO };

      (mockProductRepository.findOneOrFail as jest.Mock).mockResolvedValue(
        existingProduct,
      );
      (mockProductRepository.preload as jest.Mock).mockResolvedValue(
        updatedProduct,
      );
      (mockProductRepository.save as jest.Mock).mockResolvedValue(
        updatedProduct,
      );

      const result = await service.update(productId, updateProductDTO);

      expect(mockProductRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: productId },
        relations: ['category'],
      });
      expect(mockProductRepository.preload).toHaveBeenCalledWith({
        id: productId,
        ...updateProductDTO,
      });
      expect(mockProductRepository.save).toHaveBeenCalledWith(updatedProduct);

      expect(auditLogService.createLog).toHaveBeenCalledWith(
        Product.name,
        productId,
        Action.UPDATE,
        existingProduct,
        updatedProduct,
      );

      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException if product was not found during preload', async () => {
      const productId = 99;
      const updateProductDTO: UpdateProductDTO = { name: 'Updated Product' };

      (mockProductRepository.findOneOrFail as jest.Mock).mockResolvedValue(
        mockProducts[0],
      );
      (mockProductRepository.preload as jest.Mock).mockResolvedValue(undefined);

      await expect(service.update(productId, updateProductDTO)).rejects.toThrow(
        NotFoundException,
      );

      expect(auditLogService.createLog).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a product and log the deletion', async () => {
      const productId = 1;
      const existingProduct = mockProducts.find((p) => p.id === productId);
      (mockProductRepository.findOneOrFail as jest.Mock).mockResolvedValue(
        existingProduct,
      );
      (mockProductRepository.delete as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await service.delete(productId);

      expect(mockProductRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: productId },
        relations: ['category'],
      });
      expect(mockProductRepository.delete).toHaveBeenCalledWith(productId);

      expect(auditLogService.createLog).toHaveBeenCalledWith(
        Product.name,
        productId,
        Action.DELETE,
        existingProduct,
        null,
      );
    });

    it('should throw NotFoundException if product not found for deletion', async () => {
      const productId = 999;

      (mockProductRepository.findOneOrFail as jest.Mock).mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(service.delete(productId)).rejects.toThrow(
        NotFoundException,
      );
      expect(auditLogService.createLog).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call repository findOneOrFail with correct id and return the product if found', async () => {
      const productId = 1;
      const expectedProduct = mockProducts[0];

      (mockProductRepository.findOneOrFail as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      const result = await service.findOne(productId);

      expect(mockProductRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: productId },
        relations: ['category'],
      });

      expect(result).toEqual(expectedProduct);
    });

    it('should throw NotFoundException if repository throws EntityNotFoundError', async () => {
      const productId = 99;

      (mockProductRepository.findOneOrFail as jest.Mock).mockRejectedValue(
        new EntityNotFoundError(Product, productId),
      );

      await expect(service.findOne(productId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockProductRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: productId },
        relations: ['category'],
      });
    });
  });
});
