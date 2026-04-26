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
    console.log(chalk.cyan('Please use "opendbcli connect <url>" to add the database first.'));
    process.exit(1);
  }

  const { driver, connName: databaseName } = result;

  try {
    const tables = await driver.listTables();

    if (tables.length === 0) {
      console.log(chalk.yellow(`No tables found in database "${databaseName}".`));
    } else {
      console.log(chalk.cyan(`Tables in database "${databaseName}":`));
      console.table(tables);
    }
  } finally {
    await driver.disconnect();
  }
}

export async function describeTable(connName: string, tableName: string): Promise<void> {
  const result = await getDriverForConnection(connName);

  if (!result) {
    console.log(chalk.red(`Connection "${connName}" not found.`));
    console.log(chalk.cyan('Please use "opendbcli connect <url>" to add the database first.'));
    process.exit(1);
  }

  const { driver, connName: databaseName } = result;

  try {
    const columns = await driver.describeTable('public', tableName);

    if (columns.length === 0) {
      console.log(chalk.yellow(`Table "${tableName}" not found in database "${databaseName}".`));
    } else {
      console.log(chalk.cyan(`Structure of table "${tableName}" in database "${databaseName}":`));
      console.table(columns);

      const hasDescriptions = columns.some(col => col.description);
      if (hasDescriptions) {
        console.log(chalk.gray('\nColumn descriptions:'));
        columns.forEach(col => {
          if (col.description) {
            console.log(`  ${chalk.white(col.name)}: ${chalk.gray(col.description)}`);
          }
        });
      }
    }
  } finally {
    await driver.disconnect();
  }
}
