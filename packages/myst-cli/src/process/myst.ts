import { mystParse } from 'myst-parser';
import { cardDirective } from 'myst-ext-card';
import { gridDirective } from 'myst-ext-grid';
import { proofDirective } from 'myst-ext-proof';
import { exerciseDirectives } from 'myst-ext-exercise';
import { reactiveDirective, reactiveRole } from 'myst-ext-reactive';
import { tabDirectives } from 'myst-ext-tabs';
import { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { logMessagesFromVFile } from '../utils/logMessagesFromVFile.js';
import type { GenericParent } from 'myst-common';

/**
 * Parse MyST content using the full suite of built-in directives, roles, and plugins
 *
 * @param session session with logging
 * @param content Markdown content to parse
 * @param file path to file containing content
 */
export function parseMyst(session: ISession, content: string, file: string): GenericParent {
  const vfile = new VFile();
  vfile.path = file;
  const parsed = mystParse(content, {
    markdownit: { linkify: true },
    directives: [
      cardDirective,
      gridDirective,
      reactiveDirective,
      proofDirective,
      ...exerciseDirectives,
      ...tabDirectives,
      ...(session.plugins?.directives ?? []),
    ],
    roles: [reactiveRole, ...(session.plugins?.roles ?? [])],
    vfile,
  });
  logMessagesFromVFile(session, vfile);
  return parsed;
}
