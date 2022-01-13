import fs from 'fs';
import { ArticleState } from './walkArticle';

export async function writeBibtex(references: ArticleState['references'], filename = 'main.bib') {
  const bibliography = Object.entries(references).map(([, { bibtex }]) => bibtex);
  const bibWithNewLine = `${bibliography.join('\n\n')}\n`;
  fs.writeFileSync(filename, bibWithNewLine);
}
