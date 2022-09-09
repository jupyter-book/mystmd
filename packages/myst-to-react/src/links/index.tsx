import type { Link } from 'myst-spec';
import { Link as RemixLink } from '@remix-run/react';
import { ExternalLinkIcon, LinkIcon } from '@heroicons/react/outline';
import { useSiteManifest } from '@curvenote/ui-providers';
import type { ManifestProjectPage, SiteManifest } from '@curvenote/site-common';
import type { NodeRenderer } from '../types';
import { HoverPopover } from '../components/HoverPopover';
import { LinkCard } from '../components/LinkCard';
import { WikiLink } from './wiki';
import { RRIDLink } from './rrid';

type TransformedLink = Link & { internal?: boolean; protocol?: string };

function getPageInfo(
  site: SiteManifest | undefined,
  path: string,
): ManifestProjectPage | undefined {
  if (!site) return undefined;
  const [projectSlug, pageSlug] = path.replace(/^\//, '').split('/');
  const project = site.projects.find((p) => p.slug === projectSlug);
  if (!project) return undefined;
  return project.pages.find(
    (p) => (p as ManifestProjectPage).slug === pageSlug,
  ) as ManifestProjectPage;
}

function InternalLink({ url, children }: { url: string; children: React.ReactNode }) {
  const site = useSiteManifest();
  const page = getPageInfo(site, url);
  const skipPreview = !page || (!page.description && !page.thumbnail);
  if (!page || skipPreview) {
    return (
      <RemixLink to={url} prefetch="intent">
        {children}
      </RemixLink>
    );
  }
  return (
    <HoverPopover
      card={
        <LinkCard
          internal
          url={url}
          title={page.title}
          description={page.description}
          thumbnail={page.thumbnailOptimized || page.thumbnail}
        />
      }
    >
      <RemixLink to={url} prefetch="intent">
        {children}
      </RemixLink>
    </HoverPopover>
  );
}

export const link: NodeRenderer<TransformedLink> = (node, children) => {
  const internal = node.internal ?? false;
  const protocol = node.protocol;

  switch (protocol) {
    case 'wiki':
      return (
        <WikiLink
          key={node.key}
          url={node.url}
          page={node.data?.page as string}
          wiki={node.data?.wiki as string}
        >
          {children}
        </WikiLink>
      );
    case 'rrid':
      return <RRIDLink key={node.key} rrid={node.data?.rrid as string} />;
    default:
      if (internal) {
        return (
          <InternalLink key={node.key} url={node.url}>
            {children}
          </InternalLink>
        );
      }
      return (
        <a key={node.key} target="_blank" href={node.url} rel="noreferrer">
          {children}
        </a>
      );
  }
};

export const linkBlock: NodeRenderer<TransformedLink> = (node, children) => {
  const iconClass = 'w-6 h-6 self-center transition-transform flex-none ml-3';
  const containerClass =
    'flex-1 p-4 my-4 block border font-normal hover:border-blue-500 dark:hover:border-blue-400 no-underline hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-100 border-gray-200 dark:border-gray-500 rounded shadow-sm hover:shadow-lg dark:shadow-neutral-700';
  const internal = node.internal ?? false;
  const nested = (
    <div className="flex align-middle h-full">
      <div className="flex-grow">
        {node.title}
        <div className="text-xs text-gray-500 dark:text-gray-400">{children}</div>
      </div>
      {internal && <LinkIcon className={iconClass} />}
      {!internal && <ExternalLinkIcon className={iconClass} />}
    </div>
  );

  if (internal) {
    return (
      <RemixLink key={node.key} to={node.url} prefetch="intent" className={containerClass}>
        {nested}
      </RemixLink>
    );
  }
  return (
    <a
      key={node.key}
      className={containerClass}
      target="_blank"
      rel="noopener noreferrer"
      href={node.url}
    >
      {nested}
    </a>
  );
};

const LINK_RENDERERS = {
  link,
  linkBlock,
};

export default LINK_RENDERERS;
