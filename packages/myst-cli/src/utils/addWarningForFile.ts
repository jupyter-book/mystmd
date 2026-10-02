import { relative, resolve, sep } from 'node:path';
import chalk from 'chalk';
import picomatch from 'picomatch';
import type { ProjectConfig } from 'myst-config';
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
    // Matching is case-sensitive (nocase: false); dot: true lets `*` match dotfiles/dot-folders
    const isMatch = picomatch(pattern, { nocase: false, dot: true });
    return isMatch(key);
  } catch (error) {
    // If pattern is invalid, fall back to exact match
    return false;
  }
}

type ErrorRule = NonNullable<ProjectConfig['error_rules']>[number];

/**
 * Normalize a file location for matching against error rule `paths`:
 * relative to the current directory, with forward slashes. URLs are left as-is.
 */
export function normalizeFilePath(file: string | null | undefined): string | undefined {
  if (!file) return undefined;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(file)) return file;
  return relative(process.cwd(), resolve(file)).split(sep).join('/');
}

/**
 * Find the first error rule that applies to a message.
 *
 * A rule applies if its id matches and, when the rule has a `key` and/or `path`,
 * those match the message's key and file path (both must match if both are given).
 */
export function findErrorRule(
  rules: ErrorRule[] | undefined,
  ruleId: string,
  key?: string | null,
  file?: string | null,
): ErrorRule | undefined {
  return rules?.find((rule) => {
    if (rule.id !== ruleId) return false;
    if (rule.key && !keyMatchesPattern(key, rule.key)) return false;
    if (rule.path && !keyMatchesPattern(normalizeFilePath(file), rule.path)) return false;
    return true;
  });
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
    const handler = findErrorRule(config?.error_rules, opts.ruleId, opts.key, file);
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
    const keyHint = opts.key ? ` with key: "${opts.key}"` : '';
    const filePath = normalizeFilePath(file);
    const pathHint = filePath ? ` (optionally restricted to path: "${filePath}")` : '';
    session.log.debug(
      `To suppress this message, add rule: "${opts.ruleId}"${keyHint}${pathHint} to "error_rules" in your project config`,
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
