import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { Product } from '../product/product.entity';
import { AuditLogModule } from '../auditLog/auditLog.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AuditLogModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
