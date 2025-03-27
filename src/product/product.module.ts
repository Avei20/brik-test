import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, Category } from './product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { AuditLogModule } from '../auditLog/auditLog.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category]),
    AuditLogModule,
    StorageModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
