import {
  Controller,
  Logger,
  Post,
  Body,
  ParseIntPipe,
  Param,
  Get,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDTO } from './dto/createProduct.dto';
import { Product } from './product.entity';

@Controller('product')
export class ProductController {
  private logger: Logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() data: CreateProductDTO): Promise<Product> {
    return this.productService.create(data);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productService.findOne(id);
  }
}
