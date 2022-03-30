import fs from 'fs';
import { ISession } from '../../session/types';
import { ArticleState } from './walkArticle';

export async function writeBibtex(
  session: ISession,
  references: ArticleState['references'],
  filename = 'main.bib',
  opts = { alwaysWriteFile: true },
) {
  const seen: string[] = [];
  const bibliography = Object.entries(references)
    .map(([, { label, bibtex }]) => {
      if (seen.indexOf(label) !== -1) {
        session.log.debug(`Dropping duplicate reference ${label}`);
        return null;
      }
      seen.push(label);
      return bibtex;
    })
    .filter((item: string | null) => item != null);

  if (bibliography.length === 0 && !opts.alwaysWriteFile) {
    session.log.debug('No references to write for the project.');
    return;
  }
  session.log.debug(`Exporting references to ${filename}.`);
  const bibWithNewLine = `${bibliography.join('\n\n')}\n`;

  // escape all ampersands
  fs.writeFileSync(filename, bibWithNewLine.replace(/&/g, '\\&'), { encoding: 'utf8' });
}
