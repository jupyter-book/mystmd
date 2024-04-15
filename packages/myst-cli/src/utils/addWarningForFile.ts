import chalk from 'chalk';
import type { VFileMessage } from 'vfile-message';
import type { ISession } from '../session/types.js';
import { warnings } from '../store/reducers.js';
import type { WarningKind } from '../store/types.js';
import { selectCurrentProjectConfig } from '../store/selectors.js';

export function addWarningForFile(
  session: ISession,
  file: string | undefined | null,
  message: string,
  severity: WarningKind = 'warn',
  opts?: {
    note?: string | null;
    url?: string | null;
    position?: VFileMessage['position'];
    ruleId?: string | null;
  },
) {
  const line = opts?.position?.start.line ? `:${opts?.position.start.line}` : '';
  const column =
    opts?.position?.start.column && opts?.position?.start.column > 1
      ? `:${opts?.position.start.column}`
      : '';

  const note = opts?.note ? `\n   ${chalk.reset.dim(opts.note)}` : '';
  const url = opts?.url ? chalk.reset.dim(`\n   See also: ${opts.url}\n`) : '';
  const prefix = file ? `${file}${line}${column} ` : '';
  const formatted = `${message}${note}${url}`;
  if (opts?.ruleId) {
    const config = selectCurrentProjectConfig(session.store.getState());
    const handler = config?.error_rules?.find((rule) => rule.id === opts.ruleId);
    if (handler) {
      if (handler.severity === 'ignore') {
        session.log.debug(`${prefix}${formatted}`);
        return;
      }
      severity = handler.severity as WarningKind;
    }
  }
  switch (severity) {
    case 'info':
      session.log.info(`ℹ️  ${prefix}${formatted}`);
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
        kind: severity,
        url: opts?.url,
        note: opts?.note,
        position: opts?.position,
        ruleId: opts?.ruleId,
      }),
    );
  }
}
