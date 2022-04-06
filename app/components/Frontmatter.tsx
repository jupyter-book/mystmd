import { Frontmatter as FrontmatterType } from '~/utils';
import Email from './Icons/Email';
import OrcidLogo from './Icons/Orcid';

function Author({ author }: { author: Required<FrontmatterType>['authors'][0] }) {
  return (
    <div className="font-semibold text-sm">
      {author.name}
      {author.email && author.corresponding && (
        <a
          href={`mailto:${author.email}`}
          title={author.email}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Email className="ml-2 inline-block h-[1.2em] w-[1.2em] -translate-y-[2px]" />
        </a>
      )}
      {author.orcid && (
        <a
          href={`https://orcid.org/${author.orcid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <OrcidLogo className="ml-2 inline-block h-[1.2em] w-[1.2em] -translate-y-[2px]" />
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
          <>
            <Author key={author.name} author={author} />
            <div className="text-sm hidden sm:block">
              {author.affiliations?.map((affil, i) => (
                <div key={i}>{affil}</div>
              ))}
            </div>
          </>
        ))}
      </div>
    </header>
  );
}

export function Frontmatter({ frontmatter }: { frontmatter: FrontmatterType }) {
  return (
    <>
      <h1 className="title">{frontmatter.title}</h1>
      <AuthorAndAffiliations authors={frontmatter.authors} />
    </>
  );
}
