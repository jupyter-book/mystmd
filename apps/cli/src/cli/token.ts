import { Command } from 'commander';
import { deleteToken, setToken } from '../session';
import { clirun } from './utils';

export function addTokenCLI(program: Command) {
  const command = new Command('token').description(
    'Set or delete a token to access the Curvenote API',
  );
  command
    .command('set [token]')
    .description('Set a token and save to a config directory')
    .action(
      clirun(async (session, token?: string) => setToken(session.log, token), {
        program,
        anonymous: true,
      }),
    );
  command
    .command('delete')
    .alias('remove')
    .description('Delete all tokens from the config directory')
    .action(
      clirun((session) => deleteToken(session.log), {
        program,
        anonymous: true,
      }),
    );
  program.addCommand(command);
}
