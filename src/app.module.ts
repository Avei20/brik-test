import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, Category } from './product/product.entity';
import { AuditLog } from './auditLog/auditLog.entity';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { StorageModule } from './storage/storage.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('POSTGRES_HOST');
        const port = configService.get('POSTGRES_PORT');
        const username = configService.get('POSTGRES_USER');
        const password = configService.get('POSTGRES_PASSWORD');
        const database = configService.get('POSTGRES_DB');

        if (!host || !port || !username || !password || !database) {
          throw new Error('Database configuration is incomplete');
        }

        return {
          type: 'postgres',
          host,
          port: parseInt(port),
          username,
          password,
          database,
          entities: [Category, Product, AuditLog],
          autoLoadEntities: true,
          synchronize: true,
          ssl: false
        };
      },
      inject: [ConfigService],
    }),
    ProductModule,
    CategoryModule,
    StorageModule,
    CheckoutModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
