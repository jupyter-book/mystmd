import { Frontmatter as FrontmatterType } from '~/utils';
import Email from './Icons/Email';
import OrcidLogo from './Icons/Orcid';

export function Frontmatter({ frontmatter }: { frontmatter: FrontmatterType }) {
  return (
    <>
      <h1 className="title">{frontmatter.title}</h1>
      {frontmatter.authors && frontmatter.authors.length > 0 && (
        <header className="not-prose mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
            {frontmatter.authors?.length > 1 && (
              <>
                <div className="font-thin text-xs uppercase pb-2">Authors</div>
                <div className="font-thin text-xs uppercase pb-2 hidden sm:block">
                  Affiliations
                </div>
              </>
            )}
            {frontmatter.authors?.map((author) => (
              <>
                <div className="font-semibold text-sm">
                  {author.name}
                  {author.email && author.corresponding && (
                    <a
                      href={`mailto:${author.email}`}
                      title={author.email}
                      target="_blank"
                    >
                      <Email className="ml-2 inline-block h-[1.2em] w-[1.2em] -translate-y-[2px]" />
                    </a>
                  )}
                  {author.orcid && (
                    <a href={`https://orcid.org/${author.orcid}`}>
                      <OrcidLogo className="ml-2 inline-block h-[1.2em] w-[1.2em] -translate-y-[2px]" />
                    </a>
                  )}
                </div>
                <div className="text-sm hidden sm:block">
                  {author.affiliations.map((affil, i) => (
                    <div key={i}>{affil}</div>
                  ))}
                </div>
              </>
            ))}
          </div>
        </header>
      )}
    </>
  );
}
