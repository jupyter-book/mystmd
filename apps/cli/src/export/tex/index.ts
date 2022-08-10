import { exportFromPath } from '../utils';
import { localArticleToTex, singleArticleToTex } from './single';

export { multipleArticleToTex } from './multiple';
export { singleArticleToTex } from './single';

export const oxaLinkToArticleTex = exportFromPath(singleArticleToTex, localArticleToTex);
