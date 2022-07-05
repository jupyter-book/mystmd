import type { HtmlMetaDescriptor } from '@remix-run/react';

type SocialSite = {
  title: string;
  twitter?: string;
};

type SocialArticle = {
  origin: string;
  url: string;
  // TODO: canonical
  title: string;
  description?: string;
  image?: string;
  twitter?: string;
  keywords?: string[];
};

function allDefined(meta: Record<string, string | undefined>): HtmlMetaDescriptor {
  return Object.fromEntries(Object.entries(meta).filter(([, v]) => v)) as HtmlMetaDescriptor;
}

export function getMetaTagsForSite({ title, twitter }: SocialSite): HtmlMetaDescriptor {
  const meta = {
    title,
    'twitter:site': twitter ? `@${twitter.replace('@', '')}` : undefined,
  };
  return allDefined(meta);
}

export function getMetaTagsForArticle({
  origin,
  url,
  title,
  description,
  image,
  twitter,
  keywords,
}: SocialArticle): HtmlMetaDescriptor {
  const meta = {
    title,
    description,
    keywords: keywords?.join(', '),
    image,
    'og:url': origin && url ? `${origin}${url}` : undefined,
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'twitter:card': image ? 'summary_large_image' : 'summary',
    'twitter:creator': twitter ? `@${twitter.replace('@', '')}` : undefined,
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
    'twitter:alt': title,
  };
  return allDefined(meta);
}
