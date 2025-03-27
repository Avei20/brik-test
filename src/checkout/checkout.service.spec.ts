import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutService } from './checkout.service';
import { Product } from '../product/product.entity';
import { AuditLogService } from '../auditLog/auditLog.service';
import { NotFoundException } from '@nestjs/common';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let productRepository: Repository<Product>;
  let auditLogService: AuditLogService;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    harga: 30000,
    isDeleted: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            createLog: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    it('should successfully process a checkout', async () => {
      const items = [{ productId: 1, quantity: 2 }];
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as Product);

      const result = await service.process(items);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total', 60000);
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('createdAt');
      expect(result.items[0]).toHaveProperty('subtotal', 60000);
    });

    it('should throw error for empty cart', async () => {
      await expect(service.process([])).rejects.toThrow('Cart is empty');
    });

    it('should throw NotFoundException for non-existent product', async () => {
      const items = [{ productId: 999, quantity: 1 }];
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.process(items)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for deleted product', async () => {
      const items = [{ productId: 1, quantity: 1 }];
      // When querying with isDeleted: false, the repository should return null for deleted products
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.process(items)).rejects.toThrow(NotFoundException);
    });

    it('should calculate total correctly for multiple items', async () => {
      const items = [
        { productId: 1, quantity: 2 },
        { productId: 1, quantity: 3 },
      ];
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as Product);

      const result = await service.process(items);

      expect(result.total).toBe(150000); // (30000 * 2) + (30000 * 3)
    });
  });
});
