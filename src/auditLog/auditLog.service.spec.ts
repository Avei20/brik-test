import { Repository } from 'typeorm';
import { AuditLogService } from './auditLog.service';
import { Action, AuditLog } from './auditLog.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: Repository<AuditLog>;

  const mockAuditLogRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((auditLog) => {
        const timestamp = new Date();
        return Promise.resolve({ id: Date.now(), timestamp, ...auditLog });
      }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create an audit log entry', async () => {
      const entity = 'Product';
      const entityId = 123;
      const action = Action.UPDATE;
      const before = { name: 'Old Name' };
      const after = { name: 'New Name' };

      const expectedAuditLog = {
        entity,
        entityId,
        action,
        before,
        after,
        timestamp: expect.any(Date),
        id: expect.any(Number),
      };

      mockAuditLogRepository.save.mockResolvedValue(expectedAuditLog);

      const createdLog = await service.createLog(entity, entityId, action, before, after);

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith({
        entity: entity,
        entityId: entityId,
        action: action,
        before: before,
        after: after,
      });
      expect(createdLog).toEqual(expectedAuditLog);
    });

    it('should handle null before and after', async () => {
      const entity = 'Product';
      const entityId = 456;
      const action = Action.DELETE;
      const before = null;
      const after = null;

      const expectedAuditLog = {
        entity,
        entityId,
        action,
        before,
        after,
        timestamp: expect.any(Date),
        id: expect.any(Number),
      };

      mockAuditLogRepository.save.mockResolvedValue(expectedAuditLog);

      const createdLog = await service.createLog(entity, entityId, action, before, after);

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith({
        entity: entity,
        entityId: entityId,
        action: action,
        before: before,
        after: after,
      });
      expect(createdLog).toEqual(expectedAuditLog);
    });
  });
});
