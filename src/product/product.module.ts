import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Product } from './product.entity';
import { AuditLogModule } from 'src/auditLog/auditLog.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category]), AuditLogModule],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
