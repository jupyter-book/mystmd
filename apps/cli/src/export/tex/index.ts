import { localExportWrapper } from '../utils/localExportWrapper';
import { localArticleToTex } from './single';

export { multipleArticleToTex } from './multiple';

export const oxaLinkToArticleTex = localExportWrapper(localArticleToTex);
