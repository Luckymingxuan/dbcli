import chalk from 'chalk';
import { PostgresDriver } from '../drivers/postgres.js';
import { getConnectionByName } from './connect.js';

async function getDriverForConnection(connName: string): Promise<{ driver: PostgresDriver; connName: string } | null> {
  const connection = await getConnectionByName(connName);
  if (!connection) {
    return null;
  }

  const url = new URL(connection.url);
  url.username = connection.username;
  url.password = connection.password;

  const driver = new PostgresDriver();
  await driver.connect(url.toString());

  return { driver, connName };
}

export async function listTables(connName: string): Promise<void> {
  const result = await getDriverForConnection(connName);

  if (!result) {
    console.log(chalk.red(`Connection "${connName}" not found.`));
    console.log(chalk.cyan('Please use "dbcli connect <url>" to add the database first.'));
    process.exit(1);
  }

  const { driver, connName: databaseName } = result;

  try {
    const tables = await driver.listTables();

    if (tables.length === 0) {
      console.log(chalk.yellow(`No tables found in database "${databaseName}".`));
    } else {
      const payload = {
        database: databaseName,
        table_count: tables.length,
        tables: tables.map((table) => ({
          schema: table.schema,
          name: table.name,
        })),
      };

      console.log(chalk.cyan('Database Tables'));
      console.log(chalk.gray('=============='));
      console.log(JSON.stringify(payload, null, 2));
    }
  } finally {
    await driver.disconnect();
  }
}

export async function describeTable(connName: string, tableName: string): Promise<void> {
  const result = await getDriverForConnection(connName);

  if (!result) {
    console.log(chalk.red(`Connection "${connName}" not found.`));
    console.log(chalk.cyan('Please use "dbcli connect <url>" to add the database first.'));
    process.exit(1);
  }

  const { driver, connName: databaseName } = result;

  try {
    const columns = await driver.describeTable('public', tableName);

    if (columns.length === 0) {
      console.log(chalk.yellow(`Table "${tableName}" not found in database "${databaseName}".`));
    } else {
      const payload = {
        database: databaseName,
        table: `public.${tableName}`,
        column_count: columns.length,
        columns: columns.map((col) => ({
          name: col.name,
          type: col.dataType,
          nullable: col.isNullable,
          default: col.defaultValue,
          description: col.description,
        })),
      };

      console.log(chalk.cyan('Table Description'));
      console.log(chalk.gray('================='));
      console.log(JSON.stringify(payload, null, 2));
    }
  } finally {
    await driver.disconnect();
  }
}

export async function showTableSchema(connName: string, tableName: string): Promise<void> {
  const result = await getDriverForConnection(connName);

  if (!result) {
    console.log(chalk.red(`Connection "${connName}" not found.`));
    console.log(chalk.cyan('Please use "dbcli connect <url>" to add the database first.'));
    process.exit(1);
  }

  const { driver, connName: databaseName } = result;

  try {
    const columns = await driver.describeTable('public', tableName);

    if (columns.length === 0) {
      console.log(chalk.yellow(`Table "${tableName}" not found in database "${databaseName}".`));
      return;
    }

    const columnDefinitions = columns.map((column) => {
      const parts = [`${column.name} ${column.dataType}`];

      if (column.isNullable === false || column.isNullable === 'NO') {
        parts.push('NOT NULL');
      }

      if (column.defaultValue) {
        parts.push(`DEFAULT ${column.defaultValue}`);
      }

      return `  ${parts.join(' ')}`;
    });

    console.log(chalk.cyan('Table Schema'));
    console.log(chalk.gray('============'));
    console.log(`-- database: ${databaseName}`);
    console.log(`CREATE TABLE public.${tableName} (`);
    console.log(`${columnDefinitions.join(',\n')}`);
    console.log(');');
  } finally {
    await driver.disconnect();
  }
}

export async function showRelatedTables(connName: string, tableName: string): Promise<void> {
  const result = await getDriverForConnection(connName);

  if (!result) {
    console.log(chalk.red(`Connection "${connName}" not found.`));
    console.log(chalk.cyan('Please use "dbcli connect <url>" to add the database first.'));
    process.exit(1);
  }

  const { driver, connName: databaseName } = result;

  try {
    const columns = await driver.describeTable('public', tableName);

    if (columns.length === 0) {
      console.log(chalk.yellow(`Table "${tableName}" not found in database "${databaseName}".`));
      return;
    }

    const relations = await driver.listRelatedTables('public', tableName);

    const relatedTables = Array.from(new Set(
      relations.map((relation) => {
        const relatedSchema = relation.direction === 'outgoing' ? relation.targetSchema : relation.sourceSchema;
        const relatedTable = relation.direction === 'outgoing' ? relation.targetTable : relation.sourceTable;
        return `${relatedSchema}.${relatedTable}`;
      }),
    ));

    const payload = {
      database: databaseName,
      table: `public.${tableName}`,
      related_table_count: relatedTables.length,
      related_tables: relatedTables,
    };

    console.log(chalk.cyan('Related Tables'));
    console.log(chalk.gray('=============='));
    console.log(JSON.stringify(payload, null, 2));
  } finally {
    await driver.disconnect();
  }
}
