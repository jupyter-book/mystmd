import { mystParse, type AllOptions } from 'myst-parser';
import { buttonRole } from 'myst-ext-button';
import { cardDirective } from 'myst-ext-card';
import { gridDirectives } from 'myst-ext-grid';
import { proofDirective } from 'myst-ext-proof';
import { exerciseDirectives } from 'myst-ext-exercise';
import { tabDirectives } from 'myst-ext-tabs';
import { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import type { GenericParent } from 'myst-common';
import { selectCurrentProjectConfig } from '../store/selectors.js';

/**
 * Boiled-down options for parseMyst
 *
 * These options are far simpler than the extensive options allowed
 * if myst-parser and markdown-it are used directly.
 */
type Options = {
  ignoreFrontmatter?: boolean;
};

export function getMystParserOptions(session: ISession, opts?: Options): Partial<AllOptions> {
  // Get parser settings from project config
  // Right now this is only project level, but in the future we will allow page level settings.
  const parserOptions = selectCurrentProjectConfig(session.store.getState())?.settings?.parser;
  // Configure math extensions based on parser settings
  let mathExtension: boolean | { dollarmath?: boolean; amsmath?: boolean } = true;
  if (parserOptions?.dollarmath === false) {
    // If dollarmath is explicitly disabled, configure math to only enable amsmath
    mathExtension = { dollarmath: false, amsmath: true };
  }

  return {
    markdownit: { linkify: true },
    directives: [
      cardDirective,
      ...gridDirectives,
      proofDirective,
      ...exerciseDirectives,
      ...tabDirectives,
      ...(session.plugins?.directives ?? []),
    ],
    extensions: {
      frontmatter: !opts?.ignoreFrontmatter,
      math: mathExtension,
    },
    roles: [buttonRole, ...(session.plugins?.roles ?? [])],
  };
}

/**
 * Parse MyST content using the full suite of built-in directives, roles, and plugins
 *
 * @param session session with logging
 * @param content Markdown content to parse
 * @param file path to file containing content
 */
export function parseMyst(
  session: ISession,
  content: string,
  file: string,
  opts?: Options,
): GenericParent {
  const vfile = new VFile();
  vfile.path = file;
  const parserOptions = getMystParserOptions(session, opts);
  const parsed = mystParse(content, { ...parserOptions, vfile });
  logMessagesFromVFile(session, vfile);
  return parsed;
}
