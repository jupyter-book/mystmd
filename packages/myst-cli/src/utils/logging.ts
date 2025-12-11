import type { VFile } from 'vfile';
import type { VFileMessage } from 'vfile-message';
import type { ISession } from '../session/types.js';
import type { WarningKind } from '../store/types.js';
import { addWarningForFile } from './addWarningForFile.js';
import { writeFileToFolder } from 'myst-cli-utils';
import { join } from 'node:path';

export function logMessagesFromVFile(session: ISession, file?: VFile): void {
  if (!file) return;
  const messages = file.messages as (VFileMessage & { key?: string })[];
  messages.forEach((message) => {
    const kind: WarningKind =
      message.fatal === null ? 'info' : message.fatal === false ? 'warn' : 'error';
    addWarningForFile(session, file.path, message.message, kind, {
      position: message.position,
      note: message.note,
      url: message.url,
      ruleId: message.ruleId,
      /** This key can be combined with the ruleId to suppress a warning */
      key: message.key,
    });
  });
  file.messages = [];
}

export function writeJsonLogs(session: ISession, name: string, logData: Record<string, any>) {
  const seen = new WeakSet();
  const data = JSON.stringify(
    logData,
    function (_, value) {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    },
    2,
  );
  writeFileToFolder(join(session.buildPath(), 'logs', name), data);
}
