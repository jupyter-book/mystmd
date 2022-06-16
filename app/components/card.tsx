import { Link } from '@remix-run/react';

type Props = {
  folder: string;
  slug: string;
  title: string;
  children: React.ReactNode;
  tags?: string[];
};

export function Tag({ tag }: { tag: string }) {
  return (
    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
      #{tag}
    </span>
  );
}

export function Card({ folder, slug, title, children, tags }: Props) {
  return (
    <Link
      to={`/${folder}/${slug}`}
      prefetch="intent"
      className="min-w-xs max-w-sm rounded overflow-hidden shadow-lg mx-auto mb-10 dark:bg-stone-900 transition-transform hover:scale-105"
    >
      {/* <img className="w-full" src="/img/card-top.jpg" alt="Sunset in the mountains" /> */}
      <div className="px-6 py-4">
        <div className="font-bold text-gray-900 dark:text-gray-50 text-xl mb-2">
          {title}
        </div>
        <p className="text-gray-700 dark:text-gray-400 text-base">{children}</p>
      </div>
      <div className="px-6 pt-4 pb-2">
        {tags?.map((t) => (
          <Tag key={t} tag={t} />
        ))}
      </div>
    </Link>
  );
}
