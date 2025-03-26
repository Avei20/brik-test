import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './auditLog.entity';
import { Module } from '@nestjs/common';
import { AuditLogService } from './auditLog.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
