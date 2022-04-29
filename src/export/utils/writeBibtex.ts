import path from 'path';
import { ISession } from '../../session/types';
import { writeFileToFolder } from '../../utils';
import { ArticleState } from './walkArticle';

type Options = {
  path?: string;
  alwaysWriteFile: boolean;
};

export async function writeBibtex(
  session: ISession,
  references: ArticleState['references'],
  filename = 'main.bib',
  opts: Options = { alwaysWriteFile: true },
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
  const pathname = path.join(opts.path || '.', filename);
  session.log.debug(`Exporting references to ${pathname}.`);
  const bibWithNewLine = `${bibliography.join('\n\n')}\n`.replace(/&/g, '\\&');
  writeFileToFolder(pathname, bibWithNewLine, { encoding: 'utf8' });
}
