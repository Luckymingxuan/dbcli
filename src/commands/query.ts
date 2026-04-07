import chalk from 'chalk';
import { PostgresDriver } from '../drivers/postgres.js';
import { getActiveConnection } from './connect.js';

async function getActiveDriver(): Promise<{ driver: PostgresDriver; connName: string } | null> {
  const activeConn = await getActiveConnection();
  if (!activeConn) {
    return null;
  }

  const url = `postgresql://${activeConn.username}:${activeConn.password}@${activeConn.host}:${activeConn.port}/${activeConn.database}`;
  const driver = new PostgresDriver();
  await driver.connect(url);

  const connName = activeConn.database;
  return { driver, connName };
}

export async function executeQuery(sql: string): Promise<void> {
  const result = await getActiveDriver();

  if (!result) {
    console.log(chalk.red('No active database connection.'));
    console.log(chalk.cyan('Please use "opendbcli connect <url>" to connect to a database first.'));
    process.exit(1);
  }

  const { driver, connName } = result;

  try {
    console.log(chalk.gray(`Executing on database "${connName}":`));
    console.log(chalk.cyan(sql));
    console.log();

    const queryResult = await driver.query(sql);

    if (queryResult.rows.length === 0) {
      console.log(chalk.yellow(`Query executed successfully. No rows returned.`));
      console.log(chalk.gray(`Row count: ${queryResult.rowCount}`));
    } else {
      console.table(queryResult.rows);
      console.log(chalk.gray(`Total: ${queryResult.rows.length} row(s)`));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Query failed: ${message}`));
    process.exit(1);
  } finally {
    await driver.disconnect();
  }
}