import { NodeRenderer } from './types';
import { ClickPopover } from './ClickPopover';
import useSWR from 'swr';
import { ExternalLinkIcon } from '@heroicons/react/outline';

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => {
    if (res.status === 200) return res.json();
    throw new Error(`Content returned with status ${res.status}.`);
  });

function RRIDChild({ label }: { label: string }) {
  const { data, error } = useSWR(
    `https://scicrunch.org/resolver/${label}.json`,
    fetcher,
  );
  if (!data && !error) {
    return <span className="animate-pulse">Loading...</span>;
  }
  const hit = data?.hits?.hits?.[0];
  if (error || !hit) {
    return <span>Error loading {label}.</span>;
  }
  const {
    name: title,
    curie,
    description,
    supercategory,
    keywords,
    types: categories,
  } = hit?._source?.item ?? {};
  const category = supercategory?.[0]?.name;
  const types =
    (categories?.map(({ name }: { name: string }) => name) as string[]) ?? [];
  const tags =
    (keywords?.map(({ keyword }: { keyword: string }) => keyword) as string[]) ?? [];
  return (
    <div>
      <a
        href={`https://scicrunch.org/resolver/${label}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-1 opacity-70 hover:opacity-100"
      >
        <ExternalLinkIcon className="w-6 h-6" />
      </a>
      <p className="text-sm font-light">RRID: {category}</p>
      <div className="text-xl font-bold mb-4">
        {title} <code>{curie}</code>
      </div>
      <p className="text-md">{description}</p>
      {types.length > 0 && (
        <>
          <div className="text-xs font-thin my-2">Categories</div>
          <div className="flex flex-wrap ml-1">
            {types?.map((tag) => (
              <span className="ml-1 text-xs inline-flex items-center uppercase px-3 py-1 rounded-full border">
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
      {tags.length > 0 && (
        <>
          <div className="text-xs font-thin my-2">Tags</div>
          <div className="flex flex-wrap ml-1">
            {tags?.map((tag) => (
              <span className="ml-1 text-xs inline-flex items-center uppercase px-3 py-1 rounded-full border">
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const RRID: NodeRenderer = (node) => {
  return (
    <ClickPopover key={node.key} card={<RRIDChild label={node.label as string} />}>
      <span>RRID: </span>
      <cite className="italic">{node.label}</cite>
    </ClickPopover>
  );
};

const RRID_RENDERERS: Record<string, NodeRenderer> = {
  rrid: RRID,
};

export default RRID_RENDERERS;
