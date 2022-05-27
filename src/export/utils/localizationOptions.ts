import { oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { SharedOptions } from '@curvenote/schema/dist/types';
import { ISession } from '../../session/types';
import { ArticleState } from './walkArticle';
import { basekey } from './basekey';

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
    localizeCitation: (key) => {
      const label = references[basekey(key)]?.label;
      if (label) return label;
      session.log.error(`The reference for "${key}" was not loaded.`);
      // Return something safe for latex and markdown
      return 'unknownKey';
    },
    localizeLink: (href) => {
      const oxa = oxaLinkToId(href);
      if (!oxa) return href;
      return oxaLink(session.SITE_URL, oxa.block, oxa) as string;
    },
  };
}
