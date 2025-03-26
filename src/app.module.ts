import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, Category } from './product/product.entity';
import { AuditLog } from './auditLog/auditLog.entity';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db-klontong',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'klontong',
      synchronize: true,
      entities: [Category, Product, AuditLog],
    }),
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
