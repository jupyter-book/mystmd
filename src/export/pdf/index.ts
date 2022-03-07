import { exportFromOxaLink } from '../utils';
import { singleArticleToPdf } from './single';

export { multipleArticleToPdf } from './multiple';

export const oxaLinkToPdf = exportFromOxaLink(singleArticleToPdf);
