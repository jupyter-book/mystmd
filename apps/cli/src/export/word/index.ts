import { localExportWrapper } from '../utils/localExportWrapper';
import { localArticleToWord } from './single';

export const pathToWord = localExportWrapper(localArticleToWord);
