/*
 * @Author: Mingxuan songmingxuan936@gmail.com
 * @Date: 2026-04-05 17:01:59
 * @LastEditors: Mingxuan songmingxuan936@gmail.com
 * @LastEditTime: 2026-04-05 17:42:59
 * @FilePath: /dbcli/src/drivers/postgres.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by ${git_name_email}, All Rights Reserved. 
 */
import pg from 'pg';
import type { DatabaseDriver, QueryResult, TableInfo, ColumnInfo, RelatedTableInfo } from './interface.js';

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
        a.attname as name,
        format_type(a.atttypid, a.atttypmod) as data_type,
        CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END as is_nullable,
        pg_get_expr(ad.adbin, a.attrelid) as default_value,
        col_description(a.attrelid, a.attnum) as description
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
      WHERE n.nspname = $1
        AND c.relname = $2
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    `, [schema, table]);
    return result.rows.map((row) => ({
      name: String(row.name),
      dataType: String(row.data_type),
      isNullable: row.is_nullable === 'YES',
      defaultValue: row.default_value ? String(row.default_value) : null,
      description: row.description ? String(row.description) : null,
    }));
  }

  async listRelatedTables(schema: string, table: string): Promise<RelatedTableInfo[]> {
    const result = await this.query(`
      WITH fk_pairs AS (
        SELECT
          con.conname AS constraint_name,
          src_ns.nspname AS source_schema,
          src.relname AS source_table,
          src_attr.attname AS source_column,
          tgt_ns.nspname AS target_schema,
          tgt.relname AS target_table,
          tgt_attr.attname AS target_column
        FROM pg_constraint con
        JOIN pg_class src ON src.oid = con.conrelid
        JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
        JOIN pg_class tgt ON tgt.oid = con.confrelid
        JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
        JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS src_col(attnum, ord) ON true
        JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS tgt_col(attnum, ord) ON src_col.ord = tgt_col.ord
        JOIN pg_attribute src_attr ON src_attr.attrelid = src.oid AND src_attr.attnum = src_col.attnum
        JOIN pg_attribute tgt_attr ON tgt_attr.attrelid = tgt.oid AND tgt_attr.attnum = tgt_col.attnum
        WHERE con.contype = 'f'
      )
      SELECT
        source_schema,
        source_table,
        source_column,
        target_schema,
        target_table,
        target_column,
        'outgoing' AS direction,
        constraint_name
      FROM fk_pairs
      WHERE source_schema = $1
        AND source_table = $2

      UNION ALL

      SELECT
        source_schema,
        source_table,
        source_column,
        target_schema,
        target_table,
        target_column,
        'incoming' AS direction,
        constraint_name
      FROM fk_pairs
      WHERE target_schema = $1
        AND target_table = $2

      ORDER BY direction, source_schema, source_table, constraint_name, source_column
    `, [schema, table]);

    return result.rows.map((row) => ({
      sourceSchema: String(row.source_schema),
      sourceTable: String(row.source_table),
      sourceColumn: String(row.source_column),
      targetSchema: String(row.target_schema),
      targetTable: String(row.target_table),
      targetColumn: String(row.target_column),
      direction: row.direction === 'incoming' ? 'incoming' : 'outgoing',
      constraintName: String(row.constraint_name),
    }));
  }
}
