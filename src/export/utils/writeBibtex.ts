import fs from 'fs';
import { ISession } from '../../session/types';
import { ArticleState } from './walkArticle';

export async function writeBibtex(
  session: ISession,
  references: ArticleState['references'],
  filename = 'main.bib',
  opts = { alwaysWriteFile: true },
) {
  const bibliography = Object.entries(references).map(([, { bibtex }]) => bibtex);
  if (bibliography.length === 0 && !opts.alwaysWriteFile) {
    session.log.debug('No references to write for the project.');
    return;
  }
  session.log.debug(`Exporting references to ${filename}.`);
  const bibWithNewLine = `${bibliography.join('\n\n')}\n`;
  fs.writeFileSync(filename, bibWithNewLine);
}
