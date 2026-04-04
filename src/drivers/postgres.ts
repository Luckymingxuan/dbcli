import pg from 'pg';
import type { DatabaseDriver, QueryResult, TableInfo, ColumnInfo } from './interface.js';

export class PostgresDriver implements DatabaseDriver {
  private client: pg.PoolClient | null = null;
  private pool: pg.Pool | null = null;
  private connected = false;

  async connect(url: string): Promise<void> {
    const connectionUrl = new URL(url);

    this.pool = new pg.Pool({
      host: connectionUrl.hostname,
      port: parseInt(connectionUrl.port) || 5432,
      user: connectionUrl.username,
      password: connectionUrl.password,
      database: connectionUrl.pathname.slice(1) || 'postgres',
      ssl: connectionUrl.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : undefined,
    });

    this.client = await this.pool.connect();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.client) {
      throw new Error('Not connected to database');
    }

    const result = await this.client.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
      fields: result.fields.map((f: pg.FieldDef) => ({
        name: f.name,
        dataTypeID: f.dataTypeID,
      })),
    };
  }

  async listTables(): Promise<TableInfo[]> {
    const result = await this.query(`
      SELECT schemaname as schema, tablename as name
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);
    return result.rows as unknown as TableInfo[];
  }

  async describeTable(schema: string, table: string): Promise<ColumnInfo[]> {
    const result = await this.query(`
      SELECT
        c.column_name as name,
        c.data_type as data_type,
        c.is_nullable as is_nullable,
        c.column_default as default_value
      FROM information_schema.columns c
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `, [schema, table]);
    return result.rows as unknown as ColumnInfo[];
  }
}
