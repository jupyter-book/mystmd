import { ExportFormats } from 'myst-frontmatter';
import { localArticleToWord } from 'myst-cli';
import { localExportWrapper } from '../utils/localExportWrapper';

export const oxaLinkToWord = localExportWrapper(localArticleToWord, ExportFormats.docx);
