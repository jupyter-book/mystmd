import { Command } from 'commander';
import fs from 'fs';
import { extname } from 'path';
import { clirun, isUrl, tic, writeFileToFolder } from 'myst-cli-utils';
import checkdoi from 'doi-utils';
import chalk from 'chalk';
import { getSession } from '../session';
import type { ISession } from '../types';
import { Tags } from '../types';
import { Jats } from '../jats';
import { toText } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import { downloadJatsFromUrl } from '../download';
import { DEFAULT_RESOLVERS } from '../resolvers';
import { findDoi, formatDate, toDate } from '../utils';

function hasValidExtension(output: string) {
  return ['.xml', '.jats'].includes(extname(output).toLowerCase());
}

async function downloadAndSaveJats(
  session: ISession,
  urlOrDoi: string,
  output: string,
): Promise<string> {
  if (fs.existsSync(urlOrDoi)) {
    throw new Error(`File "${urlOrDoi}" is local and cannot be downloaded!`);
  }
  if (!(checkdoi.validate(urlOrDoi) || isUrl(urlOrDoi))) {
    throw new Error(`Path must be a URL or DOI, not "${urlOrDoi}"`);
  }
  if (!hasValidExtension(output)) {
    session.log.warn(
      `The extension ${extname(
        output,
      )} is not a valid extension for JATS, try using ".xml" or ".jats"`,
    );
  }
  const data = await downloadJatsFromUrl(session, urlOrDoi, DEFAULT_RESOLVERS);
  writeFileToFolder(output, data);
  return data;
}

async function parseJats(session: ISession, file: string): Promise<Jats> {
  const toc = tic();
  if (fs.existsSync(file)) {
    session.log.debug(`Found ${file} locally, parsing`);
    const data = fs.readFileSync(file).toString();
    session.log.debug(toc(`Parsed JATS file from disk in %s`));
    return new Jats(data);
  }
  const data = await downloadJatsFromUrl(session, file, DEFAULT_RESOLVERS);
  session.log.debug(toc(`Downloaded and parsed JATS file in %s`));
  return new Jats(data);
}

function formatLongString(data: string, offset = 0, length = 88 - offset): string {
  const out = [data.slice(0, length)];
  let left = data.slice(length);
  while (left.length > length) {
    out.push(left.slice(0, length).trim());
    left = left.slice(length);
  }
  if (left) out.push(left.trim());
  return out.join(`\n${' '.repeat(offset)}`);
}

function formatDictionary(
  dict: Record<
    string,
    | { label: (l: string) => string; value: string | string | number | boolean | null | undefined }
    | string
    | number
    | boolean
    | null
    | undefined
  >,
  opts?: { wrap?: number | false },
) {
  const maxLabel = Object.keys(dict).reduce((a, b) => Math.max(a, b.length), 0);
  return Object.entries(dict)
    .map(([k, t]) => {
      let value = t;
      let color: (l: string) => string = chalk.yellow.bold;
      if (t && typeof t === 'object') {
        if (!t.value) return null;
        color = t.label ?? color;
        value = t.value;
      }
      const wrapped =
        opts?.wrap === false
          ? String(value)
          : formatLongString(String(value), maxLabel + 2, opts?.wrap);
      return `${color(k)}:${' '.repeat(maxLabel - k.length + 1)}${wrapped}`;
    })
    .filter((o) => !!o)
    .join('\n');
}

async function jatsSummaryCLI(session: ISession, file: string) {
  const jats = await parseJats(session, file);
  const summary = {
    DOI: jats.doi ? checkdoi.buildUrl(jats.doi) : null,
    Title: toText(jats.articleTitle)?.replace(/\n/g, ' '),
    Date: formatDate(toDate(jats.publicationDate)),
    Authors: jats.articleAuthors
      .map((a) => `${toText(select(Tags.givenNames, a))} ${toText(select(Tags.surname, a))}`)
      .join(', '),
    Abstract: toText(jats.abstract)?.replace(/\n/g, ' '),
    Keywords: jats.keywords.map((k) => toText(k)).join(', '),
    License: jats.license['xlink:href'],
    Figures: { label: chalk.blue.bold, value: String(selectAll(Tags.fig, jats.body).length) },
    Equations: {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.dispFormula, jats.body).length),
    },
    Tables: {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.table, jats.body).length),
    },
    Code: {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.code, jats.body).length),
    },
    Sections: {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.sec, jats.body).length),
    },
    Paragraphs: {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.p, jats.body).length),
    },
    Citations: { label: chalk.blue.bold, value: String(jats.references.length) },
    'Cross-References': {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.xref, jats.body).length),
    },
    'Sub Articles': { label: chalk.blue.bold, value: String(jats.subArticles.length) },
  };
  session.log.info(formatDictionary(summary));
}

async function jatsReferencesCLI(session: ISession, file: string) {
  const jats = await parseJats(session, file);

  const sorted = jats.references
    .map((ref) => {
      const doi = findDoi(ref);
      const title = toText(select(Tags.articleTitle, ref));
      const year = toText(select(Tags.year, ref));
      const surnames = selectAll(Tags.surname, ref);
      const short =
        surnames.length > 2
          ? toText(surnames[0]) + ' et al.'
          : surnames.length === 2
          ? toText(surnames[0]) + ' and ' + toText(surnames[1])
          : toText(surnames[0]);
      const s = selectAll(`[rid=${ref.id}]`, jats.body);
      return {
        Citation: `${short} (${year})`,
        Title: title,
        DOI: doi ? checkdoi.buildUrl(doi) : null,
        Count: s.length,
      };
    })
    .sort((a, b) => b.Count - a.Count);
  sorted.forEach((r) => {
    session.log.info(formatDictionary(r, { wrap: false }) + '\n');
  });
}

function makeSummaryCLI(program: Command) {
  const command = new Command('summary')
    .description('Parse a JATS file and provide a summary')
    .argument('<jats>', 'The JATS file or remote URL to be parsed')
    .action(clirun(jatsSummaryCLI, { program, getSession }));
  return command;
}

function makeReferencesCLI(program: Command) {
  const command = new Command('refs')
    .alias('references')
    .description('Parse a JATS file and provide a summary')
    .argument('<jats>', 'The JATS file or remote URL to be parsed')
    .action(clirun(jatsReferencesCLI, { program, getSession }));
  return command;
}

function makeDownloadCLI(program: Command) {
  const command = new Command('download')
    .description('Parse a JATS file and provide a summary')
    .argument('<url>', 'The JATS url or a DOI')
    .argument('<output>', 'The JATS url or a DOI')
    .action(clirun(downloadAndSaveJats, { program, getSession }));
  return command;
}

export function addDownloadCLI(program: Command) {
  program.addCommand(makeDownloadCLI(program));
  program.addCommand(makeSummaryCLI(program));
  program.addCommand(makeReferencesCLI(program));
}
