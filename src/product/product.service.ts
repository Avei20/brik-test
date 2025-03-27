import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import {
  Repository,
  EntityNotFoundError,
  FindOptionsWhere,
  ILike,
} from 'typeorm';
import { CreateProductDTO } from './dto/createProduct.dto';
import { AuditLogService } from '../auditLog/auditLog.service';
import { Action } from '../auditLog/auditLog.entity';
import { FindAllDTO } from './dto/findAll.dto';
import { UpdateProductDTO } from './dto/updateProduct.dto';
import { PaginatedResponse } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductService {
  private logger: Logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private auditLogService: AuditLogService,
  ) {}

  async create(data: CreateProductDTO): Promise<Product> {
    const product = this.productRepository.create({
      ...data,
      category: { id: data.categoryId },
    });

    const result = await this.productRepository.save(product);

    await this.auditLogService.createLog(
      Product.name,
      result.id,
      Action.CREATE,
      null,
      result,
    );

    return result;
  }

  async update(id: number, data: UpdateProductDTO): Promise<Product> {
    const product = await this.findOne(id);
    const oldProduct = { ...product };

    Object.assign(product, {
      ...data,
      ...(data.categoryId && { category: { id: data.categoryId } }),
    });

    const result = await this.productRepository.save(product);

    await this.auditLogService.createLog(
      Product.name,
      result.id,
      Action.UPDATE,
      oldProduct,
      result,
    );

    return result;
  }

  async delete(id: number): Promise<void> {
    const product = await this.findOne(id);
    const oldProduct = { ...product };
    
    product.isDeleted = true;
    product.deletedAt = new Date();

    const result = await this.productRepository.save(product);

    await this.auditLogService.createLog(
      Product.name,
      result.id,
      Action.DELETE,
      oldProduct,
      result,
    );
  }

  async findAll({
    page,
    limit,
    search,
  }: FindAllDTO): Promise<PaginatedResponse<Product>> {
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Product> = {
      isDeleted: false,
    };

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const [items, total] = await this.productRepository.findAndCount({
      where,
      relations: ['category'],
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Product> {
    try {
      return await this.productRepository.findOneOrFail({
        where: { id, isDeleted: false },
        relations: ['category'],
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }
}
