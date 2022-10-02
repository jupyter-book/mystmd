import { ExportFormats } from 'myst-frontmatter';
import { localExportWrapper } from '../utils/localExportWrapper';
import { localArticleToWord } from './single';

export const pathToWord = localExportWrapper(localArticleToWord, ExportFormats.docx);
