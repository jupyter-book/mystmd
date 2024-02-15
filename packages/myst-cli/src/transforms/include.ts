import path from 'node:path';
import fs from 'node:fs';
import type { GenericParent } from 'myst-common';
import { RuleId, fileError } from 'myst-common';
import { includeDirectiveTransform } from 'myst-transforms';
import type { VFile } from 'vfile';
import { parseMyst } from '../process/myst.js';
import type { ISession } from '../session/types.js';
import { watch } from '../store/reducers.js';

export const makeFileLoader =
  (session: ISession, vfile: VFile, baseFile: string) => (filename: string) => {
    const dir = path.dirname(baseFile);
    const fullFile = path.join(dir, filename);
    if (!fs.existsSync(fullFile)) {
      fileError(vfile, `Include Directive: Could not find "${fullFile}" in "${baseFile}"`, {
        ruleId: RuleId.includeContentLoads,
      });
      return;
    }
    session.store.dispatch(
      watch.actions.addLocalDependency({
        path: baseFile,
        dependency: fullFile,
      }),
    );
    return fs.readFileSync(fullFile).toString();
  };

export async function includeFilesTransform(
  session: ISession,
  baseFile: string,
  tree: GenericParent,
  vfile: VFile,
) {
  const parseContent = (filename: string, content: string) => {
    if (filename.toLowerCase().endsWith('.html')) {
      return [{ type: 'html', value: content }];
    }
    return parseMyst(session, content, filename).children;
  };
  const loadFile = makeFileLoader(session, vfile, baseFile);
  await includeDirectiveTransform(tree, vfile, { loadFile, parseContent });
}
