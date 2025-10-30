import chalk from 'chalk';
import picomatch from 'picomatch';
import type { VFileMessage } from 'vfile-message';
import type { ISession } from '../session/types.js';
import { warnings } from '../store/reducers.js';
import type { WarningKind } from '../store/types.js';
import { selectCurrentProjectConfig } from '../store/selectors.js';

/**
 * Check if a key matches a pattern. Patterns can be:
 * - Exact matches (e.g., "https://example.com/page")
 * - Glob patterns (e.g., "*.example.com/*", "https://example.com/**")
 *
 * This function uses picomatch for pattern matching, which is the same
 * library that powers many modern build tools' glob matching.
 */
function keyMatchesPattern(key: string | null | undefined, pattern: string): boolean {
  if (!key) return false;

  // First try exact match (fastest)
  if (key === pattern) return true;

  // Check if pattern contains wildcards or special characters
  const hasWildcard = /[*?{}[\]]/.test(pattern);
  if (!hasWildcard) {
    // No wildcards, only exact match is possible
    return false;
  }

  try {
    // Use picomatch for glob pattern matching
    // Options: nocase for case-insensitive matching (useful for URLs)
    const isMatch = picomatch(pattern, { nocase: false, dot: true });
    return isMatch(key);
  } catch (error) {
    // If pattern is invalid, fall back to exact match
    return false;
  }
}

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
    /** This key can be combined with the ruleId to suppress a warning */
    key?: string | null;
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
    const handler = config?.error_rules?.find((rule) => {
      if (rule.key) {
        return rule.id === opts.ruleId && keyMatchesPattern(opts.key, rule.key);
      }
      return rule.id === opts.ruleId;
    });
    if (handler) {
      if (handler.severity === 'ignore') {
        session.log.debug(`${prefix}${formatted}`);
        return;
      }
      severity = (handler.severity as WarningKind) ?? severity;
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
      session.log.warn(`⚠️  ${prefix}${formatted}`);
      break;
    case 'debug':
    default:
      session.log.debug(`${prefix}${formatted}`);
      break;
  }
  if (opts?.ruleId) {
    session.log.debug(
      `To suppress this message, add rule: "${opts.ruleId}"${opts.key ? ` with key: "${opts.key}"` : ''} to "error_rules" in your project config`,
    );
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
