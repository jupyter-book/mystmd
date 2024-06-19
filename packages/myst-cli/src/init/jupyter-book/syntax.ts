import { mystParse } from 'myst-parser';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import { selectAll } from 'unist-util-select';
import { toText } from 'myst-common';
import { fsExists } from '../../utils/fsExists.js';
import chalk from 'chalk';
import type { ISession } from '../../session/types.js';
import { makeExecutable } from 'myst-cli-utils';
import { parse } from 'node:path';
type Line = {
  content: string;
  offset: number;
};

type LegacyGlossaryItem = {
  termLines: Line[];
  definitionLines: Line[];
};

export async function upgradeGlossaries(session: ISession) {
  let markdownPaths: string[];
  try {
    const allFiles = (await makeExecutable('git ls-files', null)()).split(/\r\n|\r|\n/);
    markdownPaths = allFiles.filter((path) => {
      const { ext } = parse(path);
      return ext == '.md';
    });
  console.log(allFiles, markdownPaths);
  } catch (error) {
    markdownPaths = await glob('**/*.md');
  }
  await Promise.all(markdownPaths.map((path) => upgradeGlossary(session, path)));
}

const SPLIT_PATTERN = /\r\n|\r|\n/;

async function upgradeGlossary(session: ISession, path: string) {
  const backupFilePath = `.${path}.myst.bak`;

  // Ensure that we havent' already done this once
  if (await fsExists(backupFilePath)) {
    return;
  }
  const data = (await fs.readFile(path)).toString();
  const documentLines = data.split(SPLIT_PATTERN);

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
      else if (!inDefinition) {
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

    for (const entry of entries) {
      const { termLines, definitionLines } = entry;

      const definitionBody = definitionLines.map((line) => line.content).join('\n');
      const [firstTerm, ...restTerms] = termLines;

      // Initial definition
      const firstTermValue = firstTerm.content.split(/\s+:\s+/, 1)[0];
      newLines.push(firstTermValue, `: ${definitionBody}\n`);

      if (restTerms) {
        // Terms can contain markup, but we need the text-form to create a term reference
        // TODO: what if something magical like an xref is used here? Assume not.
        const parsedTerm = mystParse(firstTermValue);
        const termName = toText(parsedTerm);
        for (const { content } of restTerms) {
          const term = content.split(/\s+:\s+/, 1)[0];
          newLines.push(term, `: {term}\`${termName}\`\n`);
        }
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
    await fs.rename(path, backupFilePath);

    session.log.info(chalk.dim(`Backed up original version of ${path} to ${backupFilePath}`));
    await fs.writeFile(path, documentLines.join('\n'));
  }
}
