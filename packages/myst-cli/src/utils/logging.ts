import type { VFile } from 'vfile';
import type { VFileMessage } from 'vfile-message';
import type { Point, Position } from 'unist';
import type { ISession } from '../session/types.js';
import type { WarningKind } from '../store/types.js';
import { addWarningForFile } from './addWarningForFile.js';
import { writeFileToFolder } from 'myst-cli-utils';
import { join } from 'node:path';

export function messageKind(message: VFileMessage): WarningKind {
  // vfile@6 leaves `fatal` undefined for info messages (it was null before)
  if (message.fatal == null) return 'info';
  return message.fatal === false ? 'warn' : 'error';
}

export function messagePosition(message: VFileMessage): Position | undefined {
  const place: Point | Position | undefined = message.place;
  if (!place) return undefined;
  return 'start' in place ? place : { start: place, end: place };
}

export function logMessagesFromVFile(session: ISession, file?: VFile): void {
  if (!file) return;
  const messages = file.messages as (VFileMessage & { key?: string })[];
  messages.forEach((message) => {
    addWarningForFile(session, file.path, message.message, messageKind(message), {
      position: messagePosition(message),
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
