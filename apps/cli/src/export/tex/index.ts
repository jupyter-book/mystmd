import { localExportWrapper } from '../utils/localExportWrapper';
import { localArticleToTex } from './single';

export { multipleArticleToTex } from './multiple';
export { singleArticleToTex } from './single';

export const oxaLinkToArticleTex = localExportWrapper(localArticleToTex);
