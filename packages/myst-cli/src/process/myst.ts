import type { Root } from 'mdast';
import { mystParse } from 'myst-parser';
import { cardDirective } from 'myst-ext-card';
import { gridDirective } from 'myst-ext-grid';
import { proofDirective } from 'myst-ext-proof';
import { reactiveDirective, reactiveRole } from 'myst-ext-reactive';
import { tabDirectives } from 'myst-ext-tabs';
import { VFile } from 'vfile';
import type { ISession } from '../session';
import { logMessagesFromVFile } from '../utils';

export function parseMyst(session: ISession, content: string, file: string): Root {
  const vfile = new VFile();
  vfile.path = file;
  const parsed = mystParse(content, {
    markdownit: { linkify: true },
    directives: [cardDirective, gridDirective, reactiveDirective, proofDirective, ...tabDirectives],
    roles: [reactiveRole],
    vfile,
  });
  logMessagesFromVFile(session, vfile);
  return parsed;
}
