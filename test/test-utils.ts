import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getConnection } from 'typeorm';

export async function cleanupDatabase(app: INestApplication): Promise<void> {
  const connection = getConnection();
  const entities = connection.entityMetadatas;
  
  for (const entity of entities) {
    const repository = connection.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
  }
}

export function getTestDatabaseConfig(configService: ConfigService) {
  return {
    type: 'postgres',
    host: configService.get('TEST_POSTGRES_HOST', 'localhost'),
    port: configService.get('TEST_POSTGRES_PORT', 5432),
    username: configService.get('TEST_POSTGRES_USER', 'postgres'),
    password: configService.get('TEST_POSTGRES_PASSWORD', 'postgres'),
    database: configService.get('TEST_POSTGRES_DB', 'brik_test'),
    autoLoadEntities: true,
    synchronize: true,
  };
}
