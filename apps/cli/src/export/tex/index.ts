import { ExportFormats } from 'myst-frontmatter';
import { localExportWrapper } from '../utils/localExportWrapper';
import { localArticleToTex } from './single';

export { multipleArticleToTex } from './multiple';

export const oxaLinkToTex = localExportWrapper(localArticleToTex, ExportFormats.tex);
