import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { CheckoutItem, CheckoutResult } from './interfaces/checkout.interface';
import { AuditLogService } from '../auditLog/auditLog.service';
import { Action } from '../auditLog/auditLog.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async process(items: CheckoutItem[]): Promise<CheckoutResult> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const processedItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.productRepository.findOne({
          where: { id: item.productId, isDeleted: false },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          subtotal: product.harga * item.quantity,
        };
      }),
    );

    const total = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const orderId = uuidv4();

    await this.auditLogService.createLog(
      'checkout',
      orderId, 
      Action.CREATE,
      null,
      { items: processedItems, total },
    );

    return {
      items: processedItems,
      total,
      orderId,
      createdAt: new Date(),
    };
  }
}
