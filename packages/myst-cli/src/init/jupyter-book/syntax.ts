import { mystParse } from 'myst-parser';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import { selectAll } from 'unist-util-select';
import { toText } from 'myst-common';
import chalk from 'chalk';
import type { ISession } from '../../session/types.js';
import { makeExecutable } from 'myst-cli-utils';
import { parse, join, relative } from 'node:path';
import type { INotebookContent } from '@jupyterlab/nbformat';
import { createTempFolder } from '../../utils/createTempFolder.js';

// Preserve newlines through group construct
const SPLIT_PATTERN = /\r\n|\r|\n/;
type DocumentLine = {
  content: string;
  offset: number;
};

type LegacyGlossaryItem = {
  termLines: DocumentLine[];
  definitionLines: DocumentLine[];
};
type CallbackType = () => Promise<void>;

/**
 * In-place upgrade Sphinx-style glossaries into MyST definition-list glossaries
 * in all MyST documents
 *
 * @param session - session with logging
 */
export async function upgradeProjectSyntax(session: ISession) {
  let documentPaths: string[];
  session.log.debug(chalk.dim(`Upgrading legacy-formatted files in a temporary location`));
  // Try and find all Git-tracked files, to ignore _build (hopefully)
  try {
    const allFiles = (await makeExecutable('git ls-files', null)()).split(SPLIT_PATTERN);
    documentPaths = allFiles.filter((path) => {
      const { ext } = parse(path);
      return ext == '.md' || ext == '.ipynb';
    });
  } catch (error) {
    // Fall back on globbing
    documentPaths = await glob('**/*.{md,ipynb}');
  }
  const tmpPath = createTempFolder(session);
  // Update all documents
  const maybeUpgradedPaths = await Promise.all(
    documentPaths.map((path) => upgradeDocument(session, path, tmpPath, process.cwd())),
  );

  // Now upgrade all documents
  session.log.debug(chalk.dim(`Copying upgraded files into project`));
  await Promise.all(
    maybeUpgradedPaths
      .filter((item: CallbackType | undefined): item is CallbackType => item !== undefined)
      .map((fn) => fn()),
  );
}

/**
 * In-place upgrade Sphinx-style glossaries into MyST definition-list glossaries
 * in a single document
 *
 * @param session - session with logging
 * @param path - path to document
 */
async function upgradeDocument(
  session: ISession,
  path: string,
  tmpPath: string,
  basePath: string,
): Promise<CallbackType | undefined> {
  const relativePath = relative(basePath, path);

  // Temporary location for upgrade path
  const upgradeFilePath = join(tmpPath, relativePath);

  // Ensure destination directory exists
  const { dir: temporaryFileDir } = parse(upgradeFilePath);
  await fs.mkdir(temporaryFileDir, { recursive: true });

  const { base, ext, dir: originalDir } = parse(path);
  // Callback for implementing the "atomic" replacement
  const performUpgrade = async () => {
    const backupFilePath = join(originalDir, `.${base}.bak`);
    await fs.rename(path, backupFilePath);
    await fs.rename(upgradeFilePath, path);
  };

  switch (ext) {
    case '.md':
      {
        // Upgrade entire Markdown document in one pass
        const data = (await fs.readFile(path)).toString();
        const maybeNewLines = await upgradeContent(data.split(SPLIT_PATTERN));
        if (maybeNewLines !== undefined) {
          // Write modified result
          await fs.writeFile(upgradeFilePath, maybeNewLines.join('\n'));
          session.log.info(chalk.dim(`Upgraded ${chalk.blue(path)}`));
          return performUpgrade;
        }
      }
      break;
    case '.ipynb':
      {
        // Upgrade each cell of the notebook
        const data = (await fs.readFile(path)).toString();
        const notebook = JSON.parse(data) as INotebookContent;
        const cellDidUpgrade = await Promise.all(
          notebook.cells
            .filter((cell) => cell.cell_type === 'markdown')
            .map(async (cell) => {
              // Try and upgrade the cell
              const maybeNewLines = await upgradeContent(
                (cell.source as string[])
                  // Strip newlines
                  .map((line) => line.replace('\n', '')),
              );
              // Did we compute new state?
              if (maybeNewLines !== undefined) {
                // Write to cell and indicate modification
                cell.source = maybeNewLines.map((line) => `${line}\n`);
                return true;
              } else {
                return false;
              }
            }),
        );

        // Do we need to update the notebook?
        if (cellDidUpgrade.some((x) => x)) {
          // Write modified result
          const newData = JSON.stringify(notebook);
          // Write modified result
          await fs.writeFile(upgradeFilePath, newData);
          session.log.info(chalk.dim(`Upgraded ${chalk.blue(path)}`));
          return performUpgrade;
        }
      }
      return undefined;
  }
}
export async function upgradeContent(documentLines: string[]): Promise<string[] | undefined> {
  let didUpgrade = false;

  for (const transform of [upgradeGlossary, upgradeNotes]) {
    const nextLines = await transform(documentLines);
    didUpgrade = didUpgrade || nextLines !== undefined;
    documentLines = nextLines ?? documentLines;
  }

  return didUpgrade ? documentLines : undefined;
}

const admonitionPattern =
  /^(attention|caution|danger|error|important|hint|note|seealso|tip|warning|\.callout-note|\.callout-warning|\.callout-important|\.callout-tip|\.callout-caution)$/;

async function upgradeNotes(documentLines: string[]): Promise<string[] | undefined> {
  const data = documentLines.join('\n');
  const mdast = mystParse(data);

  const caseInsenstivePattern = new RegExp(admonitionPattern.source, admonitionPattern.flags + 'i');
  const directiveNodes = selectAll('mystDirective', mdast);
  const mixedCaseAdmonitions = directiveNodes.filter((item) => {
    const name = (item as any).name as string;
    return name.match(caseInsenstivePattern) && !name.match(admonitionPattern);
  });
  mixedCaseAdmonitions.forEach((node) => {
    const start = node.position!.start.line;

    // Find declaration immediately _above_ body node
    const newLine = documentLines[start - 1].replace(
      // Find :::{fOo} or ```{fOo}
      // eslint-disable-next-line no-useless-escape
      /^(:{3,}|`{3,})\s*\{([^\}]+)\}/,
      // Replace it with :::{foo} or ```{foo}
      (_, prefix, name) => `${prefix}{${name.toLowerCase()}}`,
    );
    documentLines[start - 1] = newLine;
  });

  // Update the file
  if (mixedCaseAdmonitions.length) {
    return documentLines;
  } else {
    return undefined;
  }
}

async function upgradeGlossary(documentLines: string[]): Promise<string[] | undefined> {
  const data = documentLines.join('\n');
  const mdast = mystParse(data);
  const glossaryNodes = selectAll('mystDirective[name=glossary]', mdast);

  // Track the edit point
  let editOffset = 0;
  for (const node of glossaryNodes) {
    const nodeLines = ((node as any).value as string).split(SPLIT_PATTERN);

    // TODO: assert span items

    // Flag tracking whether the line-processor expects definition lines
    let inDefinition = false;
    let indentSize = 0;

    const entries: LegacyGlossaryItem[] = [];

    // Parse lines into separate entries
    for (let i = 0; i < nodeLines.length; i++) {
      const line = nodeLines[i];
      // Is the line a comment?
      if (/^\.\.\s/.test(line) || !line.length) {
        continue;
      }
      // Is the line a non-whitespace-leading line (term declaration)?
      else if (/^[^\s]/.test(line[0])) {
        // Comment
        if (line.startsWith('.. ')) {
          continue;
        }

        // Do we need to create a new entry?
        if (inDefinition || !entries.length) {
          // Close the current definition, open a new term
          entries.push({
            definitionLines: [],
            termLines: [{ content: line, offset: i }],
          });
          inDefinition = false;
        }
        // Can we extend existing entry with an additional term?
        else if (entries.length) {
          entries[entries.length - 1].termLines.push({ content: line, offset: i });
        }
      }
      // Open a definition
      else {
        inDefinition = true;
        indentSize = line.length - line.replace(/^\s+/, '').length;

        if (entries.length) {
          entries[entries.length - 1].definitionLines.push({
            content: line.slice(indentSize),
            offset: i,
          });
        }
      }
    }

    // Build glossary
    const newLines: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const { termLines, definitionLines } = entry;

      const [firstDefinitionLine, ...restDefinitionLines] = definitionLines;
      const [firstTerm, ...restTerms] = termLines;

      // Initial definition
      const firstTermValue = firstTerm.content.split(/\s+:\s+/, 1)[0];
      newLines.push(
        firstTermValue,
        `: ${firstDefinitionLine.content}`,
        ...restDefinitionLines.map((line) => `  ${line.content}`),
      );
      if (restTerms) {
        // Terms can contain markup, but we need the text-form to create a term reference
        // TODO: what if something magical like an xref is used here? Assume not.
        const parsedTerm = mystParse(firstTermValue);
        const termName = toText(parsedTerm);
        for (const { content } of restTerms) {
          const term = content.split(/\s+:\s+/, 1)[0];
          newLines.push(
            // Separate from parent term
            '',
            term,
            `: {term}\`${termName}\``,
          );
        }
      }

      // Will there be following terms?
      const isFinalEntry = i === entries.length - 1;
      if (!isFinalEntry) {
        newLines.push('');
      }
    }
    const nodeSpan = { start: node.position?.start?.line, stop: node.position?.end?.line };
    const spanLength = nodeSpan.stop! - nodeSpan.start! - 1;
    documentLines.splice(nodeSpan.start! + editOffset, spanLength, ...newLines);

    // Offset our insert cursor
    editOffset += newLines.length - spanLength;
  }

  // Update the file
  if (glossaryNodes.length) {
    return documentLines;
  } else {
    return undefined;
  }
}
