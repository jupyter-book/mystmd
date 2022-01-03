import { Command } from 'commander';
import { deleteToken, setToken, anonSession, clirun } from './utils';

export function addTokenCLI(program: Command) {
  const command = new Command('token').description(
    'Set or delete a token to access the Curvenote API',
  );
  command
    .command('set <token>')
    .description('Set a token and save to a config directory')
    .action(
      clirun(async (_, token: string) => setToken(token), {
        program,
        session: anonSession(program),
      }),
    );
  command
    .command('delete')
    .alias('remove')
    .description('Delete all tokens from the config directory')
    .action(clirun(deleteToken, { program, session: anonSession(program) }));
  program.addCommand(command);
}
