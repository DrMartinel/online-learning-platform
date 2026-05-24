import { Test, TestingModule } from '@nestjs/testing';
import { SystemAnalyticsController } from '../controllers/system-analytics.controller';
import { SystemAnalyticsService } from '../services/system-analytics.service';
import { AuthGuard } from '../../iam/guards/auth.guard';
import { PermissionGuard } from '../../iam/guards/permission.guard';

describe('SystemAnalyticsController', () => {
  let controller: SystemAnalyticsController;
  let service: SystemAnalyticsService;

  const mockMetrics = [
    { time: '2026-05-24T10:00:00.000Z', count: 42 },
    { time: '2026-05-24T11:00:00.000Z', count: 15 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemAnalyticsController],
      providers: [
        {
          provide: SystemAnalyticsService,
          useValue: {
            getRequestVolume: jest.fn().mockResolvedValue(mockMetrics),
            getErrors: jest.fn().mockResolvedValue([mockMetrics[0]]),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SystemAnalyticsController>(SystemAnalyticsController);
    service = module.get<SystemAnalyticsService>(SystemAnalyticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRequestVolume', () => {
    it('should return request volume metrics from service', async () => {
      const result = await controller.getRequestVolume();

      expect(result).toEqual(mockMetrics);
      expect(service.getRequestVolume).toHaveBeenCalled();
    });

    it('should return empty array when service returns empty', async () => {
      (service.getRequestVolume as jest.Mock).mockResolvedValueOnce([]);

      const result = await controller.getRequestVolume();

      expect(result).toEqual([]);
    });
  });

  describe('getErrors', () => {
    it('should return error metrics from service', async () => {
      const result = await controller.getErrors();

      expect(result).toEqual([mockMetrics[0]]);
      expect(service.getErrors).toHaveBeenCalled();
    });

    it('should return empty array when service returns empty', async () => {
      (service.getErrors as jest.Mock).mockResolvedValueOnce([]);

      const result = await controller.getErrors();

      expect(result).toEqual([]);
    });
  });
});
