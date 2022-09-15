import { exportFromPath } from '../utils/exportWrapper';
import { localArticleToPdf, singleArticleToPdf } from './single';

export { singleArticleToPdf } from './single';
export { multipleArticleToPdf } from './multiple';
export { buildPdfOnly } from './build';

export const oxaLinkToPdf = exportFromPath(singleArticleToPdf, localArticleToPdf);
