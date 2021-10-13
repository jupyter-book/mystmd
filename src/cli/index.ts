#!/usr/bin/env node
import yargs from 'yargs';
import { oxaLinkToWord } from '../word';
import { getSession, runFunction } from './utils';

const session = getSession();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { argv } = yargs(process.argv.slice(2))
  .command(
    'word [article] [output]',
    'Export a Microsoft Word document from a Curvenote link',
    (y) => {
      y.positional('article', {
        type: 'string',
        describe: 'A link to the Curvenote article (e.g. oxaLink or api link)',
      }).demandOption('article', 'You must provide a link to the article you wish to convert');
      y.positional('output', {
        type: 'string',
        default: 'article.docx',
        describe: 'The document to save',
      });
    },
    async (args: { article: string; output: string }) => {
      await runFunction(session, () => oxaLinkToWord(session, args.article, args.output));
    },
  )
  .help('help');
