import path from 'node:path';
import fs from 'node:fs';
import type { GenericParent } from 'myst-common';
import { RuleId, fileError } from 'myst-common';
import { includeDirectiveTransform } from 'myst-transforms';
import type { VFile } from 'vfile';
import { parseMyst } from '../process/index.js';
import type { ISession } from '../session/types.js';

export function includeFilesTransform(
  session: ISession,
  baseFile: string,
  tree: GenericParent,
  vfile: VFile,
) {
  const dir = path.dirname(baseFile);
  const loadFile = (filename: string) => {
    const fullFile = path.join(dir, filename);
    if (!fs.existsSync(fullFile)) {
      fileError(vfile, `Include Directive: Could not find "${fullFile}" in "${baseFile}"`, {
        ruleId: RuleId.includeContentLoads,
      });
      return;
    }
    return fs.readFileSync(fullFile).toString();
  };
  const parseContent = (filename: string, content: string) => {
    return parseMyst(session, content, filename).children;
  };
  includeDirectiveTransform(tree, vfile, { loadFile, parseContent });
}
