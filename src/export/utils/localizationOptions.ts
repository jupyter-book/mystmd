import { oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { SharedOptions } from '@curvenote/schema/dist/types';
import { ArticleState } from './walkArticle';
import { basekey } from './basekey';
import { ISession } from '../../session/types';

export function localizationOptions(
  session: ISession,
  imageFilenames: Record<string, string>,
  references: ArticleState['references'],
): SharedOptions {
  return {
    localizeImageSrc: (src) => imageFilenames[src],
    localizeId: (maybeOxaLink: string) => {
      const oxa = oxaLinkToId(maybeOxaLink);
      return oxa?.id ?? oxa?.block.block ?? maybeOxaLink;
    },
    localizeCitation: (key) => references[basekey(key)].label,
    localizeLink: (href) => {
      const oxa = oxaLinkToId(href);
      if (!oxa) return href;
      return oxaLink(session.SITE_URL, oxa.block, oxa) as string;
    },
  };
}
