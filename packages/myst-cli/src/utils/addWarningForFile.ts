import chalk from 'chalk';
import type { VFileMessage } from 'vfile-message';
import type { ISession } from '../session/types.js';
import { warnings } from '../store/reducers.js';
import type { WarningKind } from '../store/types.js';

export function addWarningForFile(
  session: ISession,
  file: string | undefined | null,
  message: string,
  kind: WarningKind = 'warn',
  opts?: { note?: string | null; url?: string | null; position?: VFileMessage['position'] },
) {
  const specific = opts?.position?.start.line
    ? `:${opts?.position.start.line}${
        opts?.position.start.column ? `:${opts?.position.start.column}` : ''
      }`
    : '';

  const note = opts?.note ? `\n   ${chalk.reset.dim(opts.note)}` : '';
  const url = opts?.url ? chalk.reset.dim(`\n   See also: ${opts.url}\n`) : '';
  const prefix = file ? `${file}${specific} ` : '';
  const formatted = `${message}${note}${url}`;
  switch (kind) {
    case 'info':
      session.log.info(`ℹ️ ${prefix}${formatted}`);
      break;
    case 'error':
      session.log.error(`⛔️ ${prefix}${formatted}`);
      break;
    case 'warn':
    default:
      session.log.warn(`⚠️  ${prefix}${formatted}`);
      break;
  }
  if (file) {
    session.store.dispatch(
      warnings.actions.addWarning({
        file,
        message,
        kind,
        url: opts?.url,
        note: opts?.note,
        position: opts?.position,
      }),
    );
  }
}
