import { Injectable, Logger } from '@nestjs/common';
import { AuditLog, Action } from './auditLog.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';

@Injectable()
export class AuditLogService {
  private logger: Logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(
    entity: string,
    entityId: string | number,
    action: Action,
    before: Record<string, any> | null,
    after: Record<string, any> | null,
  ): Promise<AuditLog> {
    const auditLog: DeepPartial<AuditLog> = {
      entity,
      entityId: typeof entityId === 'number' ? entityId.toString() : entityId,
      action,
      before,
      after,
    };

    return this.auditLogRepository.save(auditLog);
  }
}
