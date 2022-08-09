import { exportFromPath } from '../utils';
import { singleArticleToTex } from './single';

export { multipleArticleToTex } from './multiple';
export { singleArticleToTex } from './single';

export const oxaLinkToArticleTex = exportFromPath(singleArticleToTex);
