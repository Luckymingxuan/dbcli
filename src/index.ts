#!/usr/bin/env node
import { Command } from 'commander';
import { connect, disconnect, showConnections as statusConnections } from './commands/connect.js';
import { listTables, describeTable, showRelatedTables, showTableSchema } from './commands/tables.js';
import { executeQuery } from './commands/query.js';
import { skill } from './commands/skill.js';

const program = new Command();

program
  .name('dbcli')
  .description('Database CLI tool')
  .version('0.1.0')
  .addHelpCommand(false);

program
  .command('connect')
  .description('Connect to a database using a full URL with embedded username and password')
  .argument('<url>', 'Full database URL, for example postgresql://postgres:password@localhost:5432/mydb')
  .action(async (url: string) => {
    await connect(url);
  });

program
  .option('-s, --status', 'Show all saved connections status')
  .action(async (options, cmd) => {
    if (cmd.args && cmd.args.length > 0) {
      console.error(`error: unknown command '${cmd.args[0]}'`);
      process.exit(1);
    }
    if (options.status) {
      await statusConnections();
      process.exit(0);
    }
  });

program
  .command('disconnect')
  .description('Remove a saved database connection')
  .argument('<db-name>', 'Connection name to disconnect')
  .action(async (name: string) => {
    await disconnect(name);
  });

program
  .command('tables')
  .description('List all tables in the specified database')
  .argument('<db-name>', 'Connection name to query')
  .action(async (name: string) => {
    await listTables(name);
  });

program
  .command('describe')
  .description('Show the structure of a table')
  .argument('<db-name>', 'Connection name to query')
  .argument('<table>', 'Table name to describe')
  .action(async (name: string, table: string) => {
    await describeTable(name, table);
  });

program
  .command('schema')
  .description('Show a table schema in a compact DDL-style format')
  .argument('<db-name>', 'Connection name to query')
  .argument('<table>', 'Table name to inspect')
  .action(async (name: string, table: string) => {
    await showTableSchema(name, table);
  });

program
  .command('related')
  .description('Show tables related to the specified table and the linking fields')
  .argument('<db-name>', 'Connection name to query')
  .argument('<table>', 'Table name to inspect relationships for')
  .action(async (name: string, table: string) => {
    await showRelatedTables(name, table);
  });

program
  .command('query')
  .description('Execute a SQL query')
  .argument('<db-name>', 'Connection name to query')
  .argument('<sql>', 'SQL query to execute (use quotes for complex queries)')
  .action(async (name: string, sql: string) => {
    await executeQuery(name, sql);
  });

program
  .command('skill')
  .description('Print skill markdown or write it to a file')
  .option('--output <path>', 'Write skill markdown to a file')
  .action(async (options: { output?: string }) => {
    await skill(options);
  });

program.parse();
