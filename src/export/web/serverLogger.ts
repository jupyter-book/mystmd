import chalk from 'chalk';
import { ISession } from '../../session/types';
import { Logger } from '../../logging';

export function getServerLogger(session: ISession) {
  const logger: Pick<Logger, 'debug' | 'error'> = {
    debug(data: string) {
      const line = data.trim();
      if (!line || line.startsWith('>') || line.startsWith('Watching')) return;
      if (line.includes('started at http://')) {
        const [, ipAndPort] = line.split('http://');
        const port = ipAndPort.split(':')[1];
        const url = `http://${ipAndPort}`;
        const local = `http://localhost:${port}`;
        session.log.info(
          `\nServer started on port ${port}!🥳 🎉\n\n\n\t👉  ${chalk.green(local)}  👈\n\n`,
        );
        session.log.debug(`You can also access the server here: ${url}`);
        return;
      }
      session.log.info(
        line
          .replace('💿', '🚀')
          .replace(/(GET) /, '💌 $1  ')
          .replace(/(POST) /, '📦 $1 '),
      );
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      if (line.startsWith('Done in')) {
        session.log.info(`⚡️ ${line.replace('Done', 'Compiled')}`);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}
