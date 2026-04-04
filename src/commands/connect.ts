import chalk from 'chalk';
import inquirer from 'inquirer';
import { PostgresDriver } from '../drivers/postgres.js';

let currentDriver: PostgresDriver | null = null;

export function getDriver(): PostgresDriver | null {
  return currentDriver;
}

async function promptCredentials(): Promise<{ username: string; password: string }> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Username:',
      default: 'postgres',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      mask: '*',
    },
  ]);
  return answers;
}

export async function connect(urlStr: string): Promise<void> {
  if (currentDriver?.isConnected()) {
    await currentDriver.disconnect();
  }

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    console.error(chalk.red('Invalid URL format'));
    process.exit(1);
  }

  if (!url.username || !url.password) {
    console.log(chalk.cyan('Please enter your credentials:'));
    const credentials = await promptCredentials();
    url.username = credentials.username;
    url.password = credentials.password;
  }

  currentDriver = new PostgresDriver();

  try {
    console.log(chalk.cyan('Connecting to database...'));
    await currentDriver.connect(url.toString());
    console.log(chalk.green('Connected successfully!'));
  } catch (error) {
    currentDriver = null;
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Connection failed: ${message}`));
    process.exit(1);
  }
}

export async function disconnect(): Promise<void> {
  if (currentDriver) {
    await currentDriver.disconnect();
    currentDriver = null;
    console.log(chalk.yellow('Disconnected.'));
  }
}
