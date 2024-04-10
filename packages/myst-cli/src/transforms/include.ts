import path from 'node:path';
import fs from 'node:fs';
import type { GenericParent } from 'myst-common';
import { RuleId, fileError } from 'myst-common';
import { includeDirectiveTransform } from 'myst-transforms';
import type { VFile } from 'vfile';
import { parseMyst } from '../process/myst.js';
import type { ISession } from '../session/types.js';
import { watch } from '../store/reducers.js';
import { TexParser } from 'tex-to-myst';

/**
 * Return resolveFile function
 *
 * If `sourceFile` is format .tex, `relativeFile` will be resolved relative to the
 * original baseFile; otherwise, it will be resolved relative to `sourceFile`.
 *
 * The returned function will resolve the file as described above, and return it if
 * it exists or log an error and return undefined otherwise.
 */
export const makeFileResolver =
  (baseFile: string) => (relativeFile: string, sourceFile: string, vfile: VFile) => {
    const base = sourceFile.toLowerCase().endsWith('.tex') ? baseFile : sourceFile;
    const fullFile = path.resolve(path.dirname(base), relativeFile);
    if (!fs.existsSync(fullFile)) {
      fileError(
        vfile,
        `Include Directive: Could not find "${relativeFile}" relative to "${base}"`,
        {
          ruleId: RuleId.includeContentLoads,
        },
      );
      return;
    }
    return fullFile;
  };

/**
 * Return loadFile function
 *
 * Loaded file is added to original baseFile's dependencies.
 */
export const makeFileLoader = (session: ISession, baseFile: string) => (fullFile: string) => {
  session.store.dispatch(
    watch.actions.addLocalDependency({
      path: baseFile,
      dependency: fullFile,
    }),
  );
  return fs.readFileSync(fullFile).toString();
};

/**
 * Return paresContent function
 *
 * Handles html and tex files separately; all other files are treated as MyST md.
 */
export const makeContentParser =
  (session: ISession) => (filename: string, content: string, vfile: VFile) => {
    if (filename.toLowerCase().endsWith('.html')) {
      return [{ type: 'html', value: content }];
    }
    if (filename.toLowerCase().endsWith('.tex')) {
      const subTex = new TexParser(content, vfile);
      return subTex.ast.children ?? [];
    }
    return parseMyst(session, content, filename).children;
  };

export async function includeFilesTransform(
  session: ISession,
  baseFile: string,
  tree: GenericParent,
  vfile: VFile,
) {
  const parseContent = makeContentParser(session);
  const loadFile = makeFileLoader(session, baseFile);
  const resolveFile = makeFileResolver(baseFile);
  await includeDirectiveTransform(tree, vfile, {
    resolveFile,
    loadFile,
    parseContent,
    sourceFile: baseFile,
  });
}
