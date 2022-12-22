import type { VFileMessage } from 'vfile-message';
import type { ISession } from '../session/types';
import { warnings } from '../store/reducers';
import type { WarningKind } from '../store/types';

export function addWarningForFile(
  session: ISession,
  file: string | undefined | null,
  message: string,
  kind: WarningKind = 'warn',
  position?: VFileMessage['position'],
) {
  const specific = position?.start.line
    ? `:${position.start.line}${position.start.column ? `:${position.start.column}` : ''}`
    : '';
  const prefix = file ? `${file}${specific} ` : '';
  switch (kind) {
    case 'info':
      session.log.info(`ℹ️ ${prefix}${message}`);
      break;
    case 'error':
      session.log.error(`⛔️ ${prefix}${message}`);
      break;
    case 'warn':
    default:
      session.log.warn(`⚠️  ${prefix}${message}`);
      break;
  }
  if (file) {
    session.store.dispatch(warnings.actions.addWarning({ file, message, kind }));
  }
}
