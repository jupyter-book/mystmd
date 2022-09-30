import { localExportWrapper } from '../utils/localExportWrapper';
import { localArticleToPdf } from './single';

export { singleArticleToPdf } from './single';
export { multipleArticleToPdf } from './multiple';
export { buildPdfOnly } from './build';

export const oxaLinkToPdf = localExportWrapper(localArticleToPdf);
