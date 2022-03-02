import { useCatch, useLoaderData } from 'remix';
import type { LoaderFunction, LinksFunction } from 'remix';
import { getData } from '~/utils/loader.server';
import { GenericParent } from 'mystjs';
import { References, ReferencesProvider, ContentBlock } from '~/components';
import { getFolder } from '~/utils/params';

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.css',
      integrity:
        'sha384-MlJdn/WNKDGXveldHDdyRP1R4CTHr3FeuDNfhsLPYrq2t0UBkUdK2jyTnXPEK1NQ',
      crossOrigin: 'anonymous',
    },
  ];
};

type BlocksLoader = {
  title?: string;
  author?: string[];
  blocks: GenericParent[];
  references: References;
};

export let loader: LoaderFunction = async ({
  params,
  request,
}): Promise<BlocksLoader> => {
  const loader = await getData(params.folder, params.id).catch((e) => {
    console.log(e);
    return null;
  });
  if (!loader) throw new Response('Article was not found', { status: 404 });
  return {
    ...loader.frontmatter,
    blocks: loader.mdast.children as GenericParent[],
    references: loader.references,
  };
};

export default function Blog() {
  let article = useLoaderData<BlocksLoader>();
  return (
    <ReferencesProvider references={article.references}>
      <div>
        <h1 className="title">{article.title}</h1>
        <header className="not-prose mb-10">
          <ol>
            {article.author?.map((author, i) => (
              <li key={i}>{author}</li>
            ))}
          </ol>
        </header>
        {article.blocks.map((node, index) => {
          return <ContentBlock key={node.key} id={`${index}`} node={node} />;
        })}
      </div>
    </ReferencesProvider>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  // TODO: This can give a pointer to other pages in the space
  return (
    <div>
      {caught.status} {caught.statusText}
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Test</h1>
      <div>Something went wrong.</div>
    </>
  );
}
