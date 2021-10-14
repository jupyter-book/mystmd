import commander from 'commander';
import { MyUser, Session } from '../..';
import { clirun } from './utils';

async function checkAuth(session: Session) {
  if (session.isAnon) {
    session.log.error('Your session is not authenticated.');
    return;
  }
  const me = await new MyUser(session).get();
  session.log.info(`Logged in as @${me.data.username} <${me.data.email}>`);
}

export function makeAuthCLI() {
  const command = new commander.Command('auth').description('Check if you are logged into the API');
  command.command('list').description('List ').action(clirun(checkAuth));
  return command;
}
