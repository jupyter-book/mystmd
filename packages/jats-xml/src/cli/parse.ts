import { Command } from 'commander';
import fs from 'fs';
import { extname } from 'path';
import { clirun, isUrl, tic, writeFileToFolder } from 'myst-cli-utils';
import doi from 'doi-utils';
import chalk from 'chalk';
import { getSession } from '../session';
import type { ISession, Options } from '../types';
import { Tags } from '../types';
import { Jats } from '../jats';
import { toText } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import { downloadJatsFromUrl } from '../download';
import { DEFAULT_RESOLVERS } from '../resolvers';
import { findArticleId, formatDate, toDate } from '../utils';

function hasValidExtension(output: string) {
  return ['.xml', '.jats'].includes(extname(output).toLowerCase());
}

async function downloadAndSaveJats(
  session: ISession,
  urlOrDoi: string,
  output: string,
  opts: Options = { resolvers: DEFAULT_RESOLVERS },
): Promise<string> {
  if (fs.existsSync(urlOrDoi)) {
    throw new Error(`File "${urlOrDoi}" is local and cannot be downloaded!`);
  }
  if (!(doi.validate(urlOrDoi) || isUrl(urlOrDoi))) {
    throw new Error(`Path must be a URL or DOI, not "${urlOrDoi}"`);
  }
  if (!hasValidExtension(output)) {
    session.log.warn(
      `The extension ${extname(
        output,
      )} is not a valid extension for JATS, try using ".xml" or ".jats"`,
    );
  }
  const { data } = await downloadJatsFromUrl(session, urlOrDoi, opts);
  writeFileToFolder(output, data);
  return data;
}

async function parseJats(
  session: ISession,
  file: string,
  opts: Options = { resolvers: DEFAULT_RESOLVERS },
): Promise<Jats> {
  const toc = tic();
  if (fs.existsSync(file)) {
    session.log.debug(`Found ${file} locally, parsing`);
    const data = fs.readFileSync(file).toString();
    return new Jats(data, { log: session.log });
  }
  const { source, data } = await downloadJatsFromUrl(session, file, opts);
  const jats = new Jats(data, { source, log: session.log });
  session.log.debug(toc(`Downloaded and parsed JATS file in %s`));
  return jats;
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

type SummaryDict = Record<
  string,
  | {
      label?: (l: string) => string;
      value: string | string | number | boolean | null | undefined;
      wrap?: boolean;
    }
  | string
  | number
  | boolean
  | null
  | undefined
>;

function formatDictionary(dict: SummaryDict, opts?: { wrap?: boolean }) {
  const maxLabel = Object.keys(dict).reduce((a, b) => Math.max(a, b.length), 0);
  return Object.entries(dict)
    .map(([k, t]) => {
      if (!t) return null;
      let wrap = typeof opts?.wrap === 'boolean' ? opts.wrap : true;
      let value = t;
      let color: (l: string) => string = chalk.yellow.bold;
      if (t && typeof t === 'object') {
        if (!t.value) return null;
        color = t.label ?? color;
        value = t.value;
        wrap = typeof t.wrap === 'boolean' ? t.wrap : wrap;
      }
      const wrapped = wrap ? formatLongString(String(value), maxLabel + 2) : String(value);
      return `${color(k)}:${' '.repeat(maxLabel - k.length + 1)}${wrapped}`;
    })
    .filter((o) => !!o)
    .join('\n');
}

async function jatsSummaryCLI(session: ISession, file: string) {
  const jats = await parseJats(session, file);
  const summary: SummaryDict = {
    Source: { value: jats.source, wrap: false },
    DOI: jats.doi ? { value: doi.buildUrl(jats.doi), wrap: false } : null,
    Title: toText(jats.articleTitle)?.replace(/\n/g, ' '),
    Date: formatDate(toDate(jats.publicationDate)),
    Authors: jats.articleAuthors
      .map((a) => `${toText(select(Tags.givenNames, a))} ${toText(select(Tags.surname, a))}`)
      .join(', '),
    Abstract: toText(jats.abstract)?.replace(/\n/g, ' '),
    Keywords: jats.keywords.map((k) => toText(k)).join(', '),
    License: jats.license?.['xlink:href'],
  };
  if (jats.body) {
    summary.Figures = {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.fig, jats.body).length),
    };
    summary.Equations = {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.dispFormula, jats.body).length),
    };
    summary.Tables = {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.table, jats.body).length),
    };
    summary.Code = {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.code, jats.body).length),
    };
    summary.Sections = {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.sec, jats.body).length),
    };
    summary.Paragraphs = {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.p, jats.body).length),
    };
    summary.Citations = { label: chalk.blue.bold, value: String(jats.references.length) };
    summary['Cross-References'] = {
      label: chalk.blue.bold,
      value: String(selectAll(Tags.xref, jats.body).length),
    };
    summary['Sub Articles'] = { label: chalk.blue.bold, value: String(jats.subArticles.length) };
  }
  session.log.info(formatDictionary(summary));
  if (!jats.body) {
    session.log.warn('\nThis is a partial JATS record that does not have <body>.');
  }
}

async function jatsReferencesCLI(session: ISession, file: string) {
  const jats = await parseJats(session, file);

  const sorted = jats.references
    .map((ref) => {
      const doiString = findArticleId(ref, 'doi');
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
        DOI: doiString ? doi.buildUrl(doiString) : null,
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
