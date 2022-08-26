import type { VFile } from 'vfile';
import type { VFileMessage } from 'vfile-message';
import type { Node } from 'myst-spec';

export type MessageInfo = {
  node?: Node;
  note?: string;
  source?: string;
  url?: string;
  fatal?: boolean;
};

function addMessageInfo(message: VFileMessage, info?: MessageInfo) {
  if (info?.note) message.note = info?.note;
  if (info?.url) message.url = info?.url;
  if (info?.fatal) message.fatal = true;
  return message;
}

export function fileError(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  return addMessageInfo(file.message(message, opts?.node, opts?.source), opts);
}

export function fileWarn(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  return addMessageInfo(file.message(message, opts?.node, opts?.source), opts);
}

export function fileInfo(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  return addMessageInfo(file.info(message, opts?.node, opts?.source), opts);
}
