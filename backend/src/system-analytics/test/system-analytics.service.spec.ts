import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SystemAnalyticsService } from '../services/system-analytics.service';

// Mock the 'pg' module so no real database connection is created
const mockQuery = jest.fn();
const mockEnd = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockQuery,
    end: mockEnd,
  })),
}));

describe('SystemAnalyticsService', () => {
  let service: SystemAnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemAnalyticsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string | number> = {
                POSTGRES_HOST: 'localhost',
                POSTGRES_PORT: 5432,
                POSTGRES_PASSWORD: 'test-password',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SystemAnalyticsService>(SystemAnalyticsService);
    // Trigger lifecycle to initialize the pool
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    expect(mockEnd).toHaveBeenCalled();
  });

  describe('onModuleInit', () => {
    it('should create a pg Pool with config values', () => {
      const { Pool } = require('pg');
      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        user: 'supabase_admin',
        password: 'test-password',
        database: '_supabase',
      });
    });
  });

  describe('getRequestVolume', () => {
    it('should return formatted metric points on success', async () => {
      const testDate = new Date('2026-05-24T10:00:00Z');

      // First call: getTableName -> sources lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{ token: 'abc-def-123' }],
      });
      // Second call: getTableName -> table existence check
      mockQuery.mockResolvedValueOnce({
        rows: [{ exists: true }],
      });
      // Third call: the actual request volume query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { time: testDate, count: '42' },
          { time: new Date('2026-05-24T11:00:00Z'), count: '15' },
        ],
      });

      const result = await service.getRequestVolume();

      expect(result).toEqual([
        { time: '2026-05-24T10:00:00.000Z', count: 42 },
        { time: '2026-05-24T11:00:00.000Z', count: 15 },
      ]);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should return empty array when source is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.getRequestVolume();

      expect(result).toEqual([]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when analytics table does not exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ token: 'abc-def-123' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ exists: false }],
      });

      const result = await service.getRequestVolume();

      expect(result).toEqual([]);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return empty array and log error when query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      const result = await service.getRequestVolume();

      expect(result).toEqual([]);
    });

    it('should return empty array when volume query itself throws', async () => {
      // getTableName succeeds
      mockQuery.mockResolvedValueOnce({
        rows: [{ token: 'abc-def-123' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ exists: true }],
      });
      // actual query fails
      mockQuery.mockRejectedValueOnce(new Error('Query timeout'));

      const result = await service.getRequestVolume();

      expect(result).toEqual([]);
    });
  });

  describe('getErrors', () => {
    it('should return formatted error metric points on success', async () => {
      const testDate = new Date('2026-05-24T10:00:00Z');

      // getTableName calls
      mockQuery.mockResolvedValueOnce({
        rows: [{ token: 'abc-def-123' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ exists: true }],
      });
      // actual errors query
      mockQuery.mockResolvedValueOnce({
        rows: [{ time: testDate, count: '7' }],
      });

      const result = await service.getErrors();

      expect(result).toEqual([
        { time: '2026-05-24T10:00:00.000Z', count: 7 },
      ]);
    });

    it('should return empty array when source is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.getErrors();

      expect(result).toEqual([]);
    });

    it('should return empty array when analytics table does not exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ token: 'abc-def-123' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ exists: false }],
      });

      const result = await service.getErrors();

      expect(result).toEqual([]);
    });

    it('should return empty array when errors query fails', async () => {
      // getTableName succeeds
      mockQuery.mockResolvedValueOnce({
        rows: [{ token: 'abc-def-123' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ exists: true }],
      });
      // actual query fails
      mockQuery.mockRejectedValueOnce(new Error('Query failed'));

      const result = await service.getErrors();

      expect(result).toEqual([]);
    });
  });

  describe('getTableName (via public methods)', () => {
    it('should sanitize token hyphens to underscores in table name', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ token: 'aa-bb-cc-dd' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ exists: true }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getRequestVolume();

      // The volume query should reference the sanitized table name
      const volumeQueryCall = mockQuery.mock.calls[2][0];
      expect(volumeQueryCall).toContain('"aa_bb_cc_dd"');
    });
  });
});
