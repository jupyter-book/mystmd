import { oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { SharedOptions } from '@curvenote/schema/dist/types';
import { ArticleState } from '.';
import { Session } from '../../session/session';

export function localizationOptions(
  session: Session,
  imageFilenames: Record<string, string>,
  article: ArticleState,
): SharedOptions {
  return {
    localizeImageSrc: (src) => imageFilenames[src],
    localizeId: (id) => id.split('#')[1], // TODO: this is a hack
    // TODO: needs to be expanded to look up
    localizeCitation: (key) => article.references[key].label,
    localizeLink: (href) => {
      const oxa = oxaLinkToId(href);
      if (!oxa) return href;
      return oxaLink(session.SITE_URL, oxa.block, oxa) as string;
    },
  };
}
