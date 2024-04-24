import path from 'node:path';
import fs from 'node:fs';
import type { GenericParent } from 'myst-common';
import { RuleId, fileError } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { SourceFileKind } from 'myst-spec-ext';
import { includeDirectiveTransform } from 'myst-transforms';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { watch } from '../store/reducers.js';
import type { LoadFileResult } from '../process/file.js';
import { loadMdFile, loadNotebookFile, loadTexFile } from '../process/file.js';

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
  (session: ISession, file: string) =>
  async (filename: string, content: string): Promise<LoadFileResult> => {
    if (filename.toLowerCase().endsWith('.html')) {
      const mdast = { type: 'root', children: [{ type: 'html', value: content }] };
      return { mdast, kind: SourceFileKind.Article };
    }
    const opts = { keepTitleNode: true };
    if (filename.toLowerCase().endsWith('.tex')) {
      return loadTexFile(session, content, file, opts);
    }
    if (filename.toLowerCase().endsWith('.ipynb')) {
      return loadNotebookFile(session, content, file, opts);
    }
    return loadMdFile(session, content, file, opts);
  };

export async function includeFilesTransform(
  session: ISession,
  baseFile: string,
  tree: GenericParent,
  frontmatter: PageFrontmatter,
  vfile: VFile,
) {
  const parseContent = makeContentParser(session, baseFile);
  const loadFile = makeFileLoader(session, baseFile);
  const resolveFile = makeFileResolver(baseFile);
  await includeDirectiveTransform(tree, frontmatter, vfile, {
    resolveFile,
    loadFile,
    parseContent,
    sourceFile: baseFile,
  });
}
