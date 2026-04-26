import chalk from 'chalk';
import { PostgresDriver } from '../drivers/postgres.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface ConnectionInfo {
  url: string;
  database: string;
  host: string;
  port: number;
  username: string;
  password: string;
  lastConnected: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.opendbcli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'connections.json');

let connections: Map<string, ConnectionInfo> = new Map();

async function loadConnections(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Record<string, ConnectionInfo>;
    connections = new Map(Object.entries(parsed));
  } catch {
    connections = new Map();
  }
}

async function saveConnections(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const obj = Object.fromEntries(connections);
  await fs.writeFile(CONFIG_FILE, JSON.stringify(obj, null, 2), 'utf-8');
}

export function getConnections(): Map<string, ConnectionInfo> {
  return connections;
}

export async function getConnectionByName(name: string): Promise<ConnectionInfo | null> {
  await loadConnections();
  return connections.get(name) || null;
}

function isUrl(str: string): boolean {
  return str.includes('://');
}

function hasCredentials(url: URL): boolean {
  return url.username.trim().length > 0 && url.password.trim().length > 0;
}

export async function showConnections(): Promise<void> {
  await loadConnections();

  if (connections.size === 0) {
    console.log(chalk.yellow('No saved connections.'));
    console.log(chalk.cyan('Use "opendbcli connect <url>" to add a new connection.'));
    return;
  }

  const entries = Array.from(connections.entries()).sort((a, b) => {
    return new Date(b[1].lastConnected).getTime() - new Date(a[1].lastConnected).getTime();
  });

  const payload = {
    saved_databases: entries.length,
    databases: entries.map(([name, info]) => ({
      name,
      database: info.database,
      account: info.username || null,
      host: info.host,
      port: info.port,
      last_connected: info.lastConnected,
    })),
  };

  console.log(chalk.cyan('Connection Status'));
  console.log(chalk.gray('================='));
  console.log(JSON.stringify(payload, null, 2));
}

export async function connect(nameUrl: string): Promise<void> {
  await loadConnections();

  if (!isUrl(nameUrl)) {
    console.error(chalk.red('Connect only accepts a full database URL.'));
    console.log(chalk.cyan('Use a URL like: postgresql://postgres:password@localhost:5432/mydb'));
    console.log(chalk.yellow('You may have forgotten to include the username and password in the URL.'));
    process.exit(1);
  }

  const url = new URL(nameUrl);
  if (!hasCredentials(url)) {
    console.error(chalk.red('Connection failed: missing username or password in URL.'));
    console.log(chalk.cyan('Use a URL like: postgresql://postgres:password@localhost:5432/mydb'));
    console.log(chalk.yellow('You may have forgotten to include the username and password in the URL.'));
    process.exit(1);
  }

  const database = url.pathname.slice(1) || 'postgres';
  const host = url.hostname;
  const port = parseInt(url.port, 10) || 5432;
  const username = url.username;
  const password = url.password;

  const driver = new PostgresDriver();

  try {
    console.log(chalk.cyan(`Connecting to db("${database}")...`));
    await driver.connect(nameUrl);

    const connectionInfo: ConnectionInfo = {
      url: `postgresql://${host}:${port}/${database}`,
      database,
      host,
      port,
      username,
      password,
      lastConnected: new Date().toISOString(),
    };

    connections.set(database, connectionInfo);
    await saveConnections();

    console.log(chalk.green(`Connected to db("${database}") as user("${username}") successfully!`));
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Connection failed: ${message}`));
    process.exit(1);
  } finally {
    await driver.disconnect();
  }
}

export async function disconnect(name: string): Promise<void> {
  await loadConnections();

  if (!connections.has(name)) {
    console.error(chalk.red(`Connection "${name}" not found.`));
    process.exit(1);
  }

  connections.delete(name);
  await saveConnections();

  console.log(chalk.yellow(`Disconnected from "${name}" and removed it from saved connections.`));
}
