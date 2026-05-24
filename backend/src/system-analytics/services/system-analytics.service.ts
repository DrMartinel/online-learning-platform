import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SystemAnalyticsService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(SystemAnalyticsService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('POSTGRES_HOST') || 'db';
    const port = this.configService.get<number>('POSTGRES_PORT') || 5432;
    const password = this.configService.get<string>('POSTGRES_PASSWORD');
    
    this.pool = new Pool({
      host,
      port,
      user: 'supabase_admin',
      password,
      database: '_supabase',
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async getTableName(sourceName: string): Promise<string | null> {
    try {
      const sourceRes = await this.pool.query(
        `SELECT token FROM _analytics.sources WHERE name = $1 LIMIT 1`,
        [sourceName]
      );
      if (sourceRes.rows.length === 0) return null;
      
      const token = sourceRes.rows[0].token.replace(/-/g, '_');
      return `"${token}"`;
    } catch (e) {
      this.logger.error(`Failed to find table for source ${sourceName}`, e);
      return null;
    }
  }

  async getRequestVolume() {
    try {
      const tableName = await this.getTableName('cloudflare.logs.prod');
      if (!tableName) return [];

      const query = `
        SELECT 
          date_trunc('hour', timestamp) as time,
          count(*) as count
        FROM _analytics.${tableName}
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY time
        ORDER BY time ASC;
      `;
      const res = await this.pool.query(query);
      return res.rows.map(r => ({
        time: r.time.toISOString(),
        count: parseInt(r.count, 10)
      }));
    } catch (error) {
      this.logger.error('Failed to get request volume', error);
      return [];
    }
  }

  async getErrors() {
    try {
      const tableName = await this.getTableName('cloudflare.logs.prod');
      if (!tableName) return [];

      // Cast status_code safely by checking if metadata exists
      const query = `
        SELECT 
          date_trunc('hour', timestamp) as time,
          count(*) as count
        FROM _analytics.${tableName}
        WHERE timestamp > NOW() - INTERVAL '24 hours'
          AND metadata->'response'->>'status_code' IS NOT NULL
          AND CAST(metadata->'response'->>'status_code' AS INTEGER) >= 400
        GROUP BY time
        ORDER BY time ASC;
      `;
      const res = await this.pool.query(query);
      return res.rows.map(r => ({
        time: r.time.toISOString(),
        count: parseInt(r.count, 10)
      }));
    } catch (error) {
      this.logger.error('Failed to get errors', error);
      return [];
    }
  }
}
