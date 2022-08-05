import { Command } from 'commander';
import { MyUser } from '../models';
import type { ISession } from '../session/types';
import { clirun } from './utils';

async function checkAuth(session: ISession) {
  if (session.isAnon) {
    session.log.error('Your session is not authenticated.');
    return;
  }
  const me = await new MyUser(session).get();
  session.log.info(`Logged in as @${me.data.username} <${me.data.email}>`);
}

export function addAuthCLI(program: Command) {
  const command = new Command('auth').description('Check if you are logged into the API');
  command.command('list').description('List ').action(clirun(checkAuth, { program }));
  program.addCommand(command);
}
