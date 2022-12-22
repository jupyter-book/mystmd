import chalk from 'chalk';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types';
import type { WarningKind } from '../store/types';
import { addWarningForFile } from './addWarningForFile';

export function logMessagesFromVFile(session: ISession, file?: VFile): void {
  if (!file) return;
  file.messages.forEach((message) => {
    const kind: WarningKind =
      message.fatal === null ? 'info' : message.fatal === false ? 'warn' : 'error';
    const note = message.note ? `\n\n${chalk.dim(message.note)}` : '';
    const url = message.url ? chalk.dim(`\n\nSee also: ${message.url}\n`) : '';
    addWarningForFile(session, file.path, `${message.message}${note}${url}`, kind, {
      position: message.position,
    });
  });
  file.messages = [];
}
