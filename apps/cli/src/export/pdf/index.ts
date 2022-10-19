import { ExportFormats } from 'myst-frontmatter';
import { localArticleToPdf } from 'myst-cli';
import { localExportWrapper } from '../utils/localExportWrapper';

export { multipleArticleToPdf } from './multiple';
export { buildPdfOnly } from './build';

export const oxaLinkToPdf = localExportWrapper(localArticleToPdf, ExportFormats.pdf);
