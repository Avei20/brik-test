import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product, Category } from './product.entity';
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
import { PaginatedResponse } from 'src/common/dto/paginatio.dto';

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

  async findAll({
    page,
    limit,
    search,
  }: FindAllDTO): Promise<PaginatedResponse<Product>> {
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Product>[] = [];

    if (search) {
      where.push({ name: ILike(`%${search}%`) });
      where.push({ sku: ILike(`%${search}%`) });
      where.push({ description: ILike(`%${search}%`) });
    }

    const [data, total] = await this.productRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      skip: skip,
      take: limit,
      order: { id: 'ASC' },
      relations: ['category'],
    });

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async findOne(id: number): Promise<Product> {
    try {
      const product = await this.productRepository.findOneOrFail({
        where: { id },
        relations: ['category'],
      });
      return product;
    } catch (error: unknown) {
      if (error instanceof EntityNotFoundError) {
        this.logger.warn(`Product with id ${id} not found`);
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to find product with ID ${id}`, stack);
      throw error;
    }
  }

  async update(id: number, data: UpdateProductDTO): Promise<Product> {
    const existingProduct = await this.findOne(id);

    const updateData: Partial<Product> = { ...data };

    if (data.categoryId !== undefined) {
      updateData.category = { id: data.categoryId } as Category;
    }

    const updatedProduct = await this.productRepository.preload({
      id: id,
      ...updateData,
    });

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const savedProduct = await this.productRepository.save(updatedProduct);

    await this.auditLogService.createLog(
      Product.name,
      id,
      Action.UPDATE,
      existingProduct,
      savedProduct,
    );

    return savedProduct;
  }

  async delete(id: number): Promise<void> {
    const product = await this.findOne(id);

    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Product with ID ' + id + ' not found');
    }

    await this.auditLogService.createLog(
      Product.name,
      id,
      Action.DELETE,
      product,
      null,
    );
  }
}
