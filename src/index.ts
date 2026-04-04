import { Command } from 'commander';
import { connect, disconnect } from './commands/connect.js';

const program = new Command();

program
  .name('dbcli')
  .description('Database CLI tool')
  .version('0.1.0');

program
  .command('connect')
  .description('Connect to a database')
  .argument('<url>', 'PostgreSQL connection URL (e.g., postgresql://user:pass@host:5432/dbname)')
  .action(async (url: string) => {
    await connect(url);
  });

program
  .command('disconnect')
  .description('Disconnect from current database')
  .action(async () => {
    await disconnect();
  });

program.parse();
