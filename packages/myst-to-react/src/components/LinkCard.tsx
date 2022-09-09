import { Link as RemixLink } from '@remix-run/react';
import { ExternalLinkIcon } from '@heroicons/react/outline';
import classNames from 'classnames';

export function LinkCard({
  url,
  title,
  internal = false,
  loading = false,
  description,
  thumbnail,
}: {
  url: string;
  internal?: boolean;
  loading?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  thumbnail?: string;
}) {
  return (
    <div className={classNames('w-[300px]', { 'animate-pulse': loading })}>
      {internal && (
        <RemixLink to={url} className="block" prefetch="intent">
          {title}
        </RemixLink>
      )}
      {!internal && (
        <a href={url} className="block" target="_blank" rel="noreferrer">
          <ExternalLinkIcon className="w-4 h-4 float-right" />
          {title}
        </a>
      )}
      {!loading && thumbnail && (
        <img src={thumbnail} className="w-full max-h-[200px] object-cover object-top" />
      )}
      {loading && (
        <div className="animate-pulse bg-slate-100 dark:bg-slate-800 w-full h-[150px] mt-4" />
      )}
      {!loading && description && <div className="mt-2">{description}</div>}
    </div>
  );
}
