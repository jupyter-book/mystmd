import { useEffect } from 'react';
import type { Link } from 'myst-spec';
import { Link as RemixLink, useFetcher } from '@remix-run/react';
import { ExternalLinkIcon, LinkIcon } from '@heroicons/react/outline';
import type { NodeRenderer } from './types';
import { HoverPopover } from './HoverPopover';
import classNames from 'classnames';

type TransformedLink = Link & { internal?: boolean };

function LinkCard({ url, open }: { url: string; open: boolean }) {
  const fetcher = useFetcher();
  useEffect(() => {
    if (fetcher.type === 'init' && open) {
      fetcher.load(url);
    }
  }, [open, fetcher]);

  const data = fetcher?.data; // the data from the loader
  const { title, description, thumbnail } = data?.frontmatter ?? {};
  return (
    <div className={classNames('w-[300px]', { 'animate-pulse': !data })}>
      <RemixLink to={url} className="block" prefetch="intent">
        <ExternalLinkIcon className="w-4 h-4 float-right" />
        {title}
      </RemixLink>
      {!data && <div className="animate-pulse bg-slate-100 w-full h-[150px] mt-4" />}
      {thumbnail && (
        <img src={thumbnail} className="w-full max-h-[200px] object-cover object-top" />
      )}
      <div className="mt-2">{description}</div>
    </div>
  );
}

function InternalLink({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <HoverPopover card={({ open }) => <LinkCard url={url} open={open} />}>
      <RemixLink to={url} prefetch="intent">
        {children}
      </RemixLink>
    </HoverPopover>
  );
}

export const link: NodeRenderer<TransformedLink> = (node, children) => {
  const internal = node.internal ?? false;

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
