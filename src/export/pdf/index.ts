import { exportFromOxaLink } from '../utils';
import { singleArticleToPdf } from './single';

export { singleArticleToPdf } from './single';
export { multipleArticleToPdf } from './multiple';
export { buildPdfOnly } from './build';

export const oxaLinkToPdf = exportFromOxaLink(singleArticleToPdf);
