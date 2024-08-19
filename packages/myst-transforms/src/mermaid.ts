import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';
import { RuleId } from 'myst-common';
import which from 'which';
import type { VFile } from 'vfile';
import type { LoggerDE } from 'myst-cli-utils';
import type { ISession } from 'myst-cli';
import { makeExecutable, tic } from 'myst-cli-utils';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { createTempFolder, addWarningForFile } from 'myst-cli';

function isMMDCCommandAvailable() {
  return !!which.sync('mmdc', { nothrow: true });
}
type Literal = {
  type: string;
  value: string;
};

function createMMDCLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line) return;
      session.log.debug(data);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      session.log.error(data);
    },
  };
  return logger;
}

async function convertMermaidToSVG(
  session: ISession,
  writeFolder: string,
  data: string,
  vfile: VFile,
) {
  const hash = createHash('md5').update(data).digest('hex');
  const tempFolder = createTempFolder(session);

  const srcPath = join(tempFolder, `${hash}.mmd`);
  await fs.writeFile(srcPath, data);

  await fs.mkdir(writeFolder, { recursive: true });
  const dstPath = join(writeFolder, `${hash}.pdf`);

  const executable = `mmdc -i ${srcPath} -o ${dstPath}`;
  const exec = makeExecutable(executable, createMMDCLogger(session));
  try {
    await exec();
  } catch (err) {
    addWarningForFile(
      session,
      vfile.path,
      `Could not convert Mermaid diagram to svg: ${err}`,
      'error',
      {
        ruleId: RuleId.mermaidDiagramConverted,
      },
    );
    return null;
  }

  return dstPath;
}

/**
 * Ensure caption content is nested in a paragraph.
 *
 * This function is idempotent.
 */
export async function mermaidToImageTransform(
  session: ISession,
  tree: GenericParent,
  writeFolder: string,
  vfile: VFile,
) {
  if (!isMMDCCommandAvailable()) {
    addWarningForFile(
      session,
      vfile.path,
      `Could not find mmdc, required for conversion of Mermaid diagrams\n`,
      'warn',
      { ruleId: RuleId.mermaidDiagramConverted },
    );
    return null;
  }

  const nodes = selectAll('mermaid', tree) as Literal[];
  await Promise.all(
    nodes.map(async (node) => {
      const dst = await convertMermaidToSVG(session, writeFolder, node.value, vfile);
      if (dst) {
        const newNode = node as GenericNode;
        newNode.type = 'image';
        newNode.url = dst ?? '';
      }
    }),
  );
}
