import classNames from 'classnames';
import React from 'react';
import { Frontmatter as FrontmatterType } from '~/utils';
import { KINDS } from '@curvenote/blocks';
import { LicenseBadges } from './Icons/License';
import Email from './Icons/Email';
import GitHub from './Icons/GitHub';
import OpenAccessLogo from './Icons/OpenAccess';
import OrcidLogo from './Icons/Orcid';
import { Jupyter } from './Icons/Jupyter';
import ROR from './Icons/ROR';

function Author({ author }: { author: Required<FrontmatterType>['authors'][0] }) {
  return (
    <div className="font-semibold text-sm">
      {author.name}
      {author.email && author.corresponding && (
        <a
          href={`mailto:${author.email}`}
          title={`${author.name} <${author.email}>`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Email className="ml-2 inline-block h-[1.2em] w-[1.2em] -translate-y-[2px] text-gray-400 hover:text-blue-400" />
        </a>
      )}
      {author.orcid && (
        <a
          href={`https://orcid.org/${author.orcid}`}
          target="_blank"
          rel="noopener noreferrer"
          title="ORCID (Open Researcher and Contributor ID)"
        >
          <OrcidLogo className="ml-2 inline-block h-[1.2em] w-[1.2em] -translate-y-[2px] grayscale hover:grayscale-0" />
        </a>
      )}
    </div>
  );
}

function AuthorAndAffiliations({ authors }: { authors: FrontmatterType['authors'] }) {
  if (!authors || authors.length === 0) return null;
  const hasAffliations = authors.reduce(
    (r, { affiliations: a }) => r || a?.length > 0,
    false,
  );
  if (!hasAffliations) {
    return (
      <header className="not-prose mb-10">
        {authors.length > 1 && (
          <div className="font-thin text-xs uppercase pb-2">Authors</div>
        )}
        {authors.map((author) => (
          <Author key={author.name} author={author} />
        ))}
      </header>
    );
  }
  return (
    <header className="not-prose mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
        {authors.length > 1 && (
          <>
            <div className="font-thin text-xs uppercase pb-2">Authors</div>
            <div className="font-thin text-xs uppercase pb-2 hidden sm:block">
              Affiliations
            </div>
          </>
        )}
        {authors.map((author) => (
          <React.Fragment key={author.name}>
            <Author author={author} />
            <div className="text-sm hidden sm:block">
              {author.affiliations?.map((affil, i) => {
                if (typeof affil === 'string') {
                  return <div key={i}>{affil}</div>;
                }
                const { name, ror } = affil as any as { name: string; ror?: string };
                if (ror) {
                  return (
                    <div key={i}>
                      {name}
                      <a
                        href={`https://ror.org/${ror}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="ROR (Research Organization Registry)"
                      >
                        <ROR className="ml-2 inline-block h-[2em] w-[2em] grayscale hover:grayscale-0 -translate-y-[1px]" />
                      </a>
                    </div>
                  );
                }
                return <div key={i}>{name}</div>;
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </header>
  );
}

function DOI({ doi: possibleLink }: { doi?: string }) {
  if (!possibleLink) return null;
  const doi = possibleLink.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '');
  return (
    <div className="flex-none" title="DOI (Digital Object Identifier)">
      DOI:
      <a
        className="font-light no-underline pl-1"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://doi.org/${doi}`}
      >
        {doi}
      </a>
    </div>
  );
}

function GitHubLink({ github: possibleLink }: { github?: string }) {
  if (!possibleLink) return null;
  const github = possibleLink.replace(/^(https?:\/\/)?github\.com\//, '');
  return (
    <a
      href={`https://github.com/${github}`}
      title={`GitHub Repository: ${github}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <GitHub className="h-[1.3em] translate-y-[0.1em] px-2 opacity-60 hover:opacity-100 dark:invert" />
    </a>
  );
}

function OpenAccessBadge({ open_access }: { open_access?: boolean }) {
  if (!open_access) return null;
  return (
    <a
      className="grayscale hover:grayscale-0"
      href="https://en.wikipedia.org/wiki/Open_access"
      target="_blank"
      rel="noopener noreferrer"
      title="Open Access"
    >
      <OpenAccessLogo className="h-[1.3em] translate-y-[0.1em] px-2" />
    </a>
  );
}

function Journal({
  venue,
  biblio,
}: {
  venue?: Required<FrontmatterType>['venue'];
  biblio?: Required<FrontmatterType>['biblio'];
}) {
  if (!venue) return null;
  const { title, url } =
    typeof venue === 'string' ? { title: venue, url: null } : venue;
  if (!title) return null;
  const { volume, issue } = biblio ?? {};
  return (
    <div className="flex-none mr-2">
      {url ? (
        <a
          className="smallcaps font-semibold no-underline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
        >
          {title}
        </a>
      ) : (
        <span className="smallcaps font-semibold">{title}</span>
      )}
      {volume != null && (
        <span className="ml-2 pl-2 border-l hidden lg:inline-block">
          Volume {volume}
          {issue != null && <>, Issue {issue}</>}
        </span>
      )}
    </div>
  );
}

export function Frontmatter({
  kind,
  frontmatter,
}: {
  kind: KINDS;
  frontmatter: FrontmatterType;
}) {
  const { subject, doi, open_access, license, github, venue, biblio } = frontmatter;
  const hasHeaders =
    subject || doi || open_access || license || github || venue || biblio || true;
  return (
    <>
      {hasHeaders && (
        <div className="flex mt-3 mb-5 text-sm font-light">
          {subject && (
            <div
              className={classNames(
                'flex-none pr-2 smallcaps  hidden lg:inline-block',
                {
                  'border-r mr-2': venue,
                },
              )}
            >
              {subject}
            </div>
          )}
          <Journal venue={venue} biblio={biblio} />
          <div className="flex-grow"></div>
          <Jupyter jupyter={kind === KINDS.Notebook} />
          <GitHubLink github={github} />
          <LicenseBadges license={license} />
          <OpenAccessBadge open_access={open_access} />
          <DOI doi={doi} />
        </div>
      )}
      <h1 className={classNames('title', { 'mb-2': frontmatter.subtitle })}>
        {frontmatter.title}
      </h1>
      {frontmatter.subtitle && (
        <h2 className="title mt-0 text-zinc-600 dark:text-zinc-400">
          {frontmatter.subtitle}
        </h2>
      )}
      <AuthorAndAffiliations authors={frontmatter.authors} />
    </>
  );
}
