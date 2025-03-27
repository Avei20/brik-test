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
import { FindAllDTO } from './dto/findAll.dto';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: Repository<Product>;
  let auditLogService: AuditLogService;

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Ciki ciki',
      description: 'Ciki ciki yang super enak, hanya di toko klontong kami',
      sku: 'MHZVTK',
      weight: 500,
      width: 5,
      height: 5,
      length: 5,
      image: 'https://cf.shopee.co.id/file/7cb930d1bd183a435f4fb3e5cc4a896b',
      harga: 30000,
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
      category: {
        id: 14,
        name: 'Cemilan',
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
      weight: 300,
      width: 3,
      height: 3,
      length: 3,
      image: 'image2.jpg',
      harga: 20000,
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
    save: jest.fn().mockImplementation((product) => {
      if (product.sku === 'DUPLICATE_SKU') {
        throw new Error('Duplicate SKU');
      }
      return Promise.resolve({ id: Date.now(), ...product });
    }),
    findOne: jest.fn().mockImplementation(({ where: { id } }) =>
      Promise.resolve(mockProducts.find((p) => p.id === id)),
    ),
    findOneOrFail: jest.fn().mockImplementation(({ where: { id } }) => {
      const product = mockProducts.find((p) => p.id === id);
      if (!product) {
        return Promise.reject(new EntityNotFoundError(Product, id));
      }
      return Promise.resolve(product);
    }),
    findAndCount: jest.fn().mockImplementation(({ where, skip, take }) => {
      let filteredProducts = [...mockProducts];
      
      if (where?.name) {
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(where.name.value.toLowerCase().replace(/%/g, ''))
        );
      }

      const paginatedProducts = filteredProducts.slice(skip, skip + take);
      return Promise.resolve([paginatedProducts, filteredProducts.length]);
    }),
  };

  const mockAuditLogService = {
    createLog: jest.fn().mockResolvedValue(undefined),
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
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const findAllDto: FindAllDTO = { page: 1, limit: 10 };
      const result = await service.findAll(findAllDto);
      
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should search products by name', async () => {
      const findAllDto: FindAllDTO = { page: 1, limit: 10, search: 'Ciki ciki' };
      const result = await service.findAll(findAllDto);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Ciki ciki');
    });

    it('should return empty array when no products match search', async () => {
      const findAllDto: FindAllDTO = { page: 1, limit: 10, search: 'NonExistent' };
      const result = await service.findAll(findAllDto);
      
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockProducts[0]);
    });

    it('should throw NotFoundException when product not found', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should include category relation', async () => {
      const result = await service.findOne(1);
      expect(result.category).toBeDefined();
      expect(result.category.id).toBe(14);
    });
  });

  describe('create', () => {
    it('should create a product and log the creation', async () => {
      const createProductDto: CreateProductDTO = {
        name: 'New Product',
        description: 'New Description',
        sku: 'NEW-SKU',
        categoryId: 1,
        weight: 100,
        width: 10,
        height: 10,
        length: 10,
        image: 'new-image.jpg',
        harga: 10000,
      };

      const result = await service.create(createProductDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createProductDto.name);
      expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
        Product.name,
        expect.any(Number),
        Action.CREATE,
        null,
        result,
      );
    });
  });

  describe('update', () => {
    it('should update a product and log the update', async () => {
      const updateProductDto: UpdateProductDTO = {
        name: 'Updated Product',
        harga: 15000,
      };

      const result = await service.update(1, updateProductDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateProductDto.name);
      expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
        Product.name,
        1,
        Action.UPDATE,
        expect.any(Object),
        result,
      );
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should mark a product as deleted and log the deletion', async () => {
      await service.delete(1);

      expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
        Product.name,
        1,
        Action.DELETE,
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
