import commander from 'commander';
import { deleteToken, setToken, anonSession, clirun } from './utils';

export function makeTokenCLI() {
  const command = new commander.Command('token').description(
    'Set or delete a token to access the Curvenote API',
  );
  command
    .command('set <token>')
    .description('Set a token and save to a config directory')
    .action(clirun(async (_, token: string) => setToken(token), anonSession()));
  command
    .command('delete')
    .alias('remove')
    .description('Delete all tokens from the config directory')
    .action(clirun(deleteToken, anonSession()));
  return command;
}
