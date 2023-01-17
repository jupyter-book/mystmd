import type { VFile } from 'vfile';
import type { ISession } from '../session/types';
import type { WarningKind } from '../store/types';
import { addWarningForFile } from './addWarningForFile';

export function logMessagesFromVFile(session: ISession, file?: VFile): void {
  if (!file) return;
  file.messages.forEach((message) => {
    const kind: WarningKind =
      message.fatal === null ? 'info' : message.fatal === false ? 'warn' : 'error';
    addWarningForFile(session, file.path, message.message, kind, {
      position: message.position,
      note: message.note,
      url: message.url,
    });
  });
  file.messages = [];
}
