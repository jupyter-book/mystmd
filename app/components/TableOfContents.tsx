import classNames from 'classnames';
import throttle from 'lodash.throttle';
import { useEffect, useRef, useState } from 'react';

const SELECTOR = [1, 2, 3, 4, 5, 6].map((n) => `main h${n}`).join(', ');

const onClient = typeof document !== 'undefined';

type Heading = {
  id: string;
  title: string;
  level: number;
};
type Props = {
  headings: Heading[];
  activeId?: string;
};
/**
 * This renders an item in the table of contents list.
 * scrollIntoView is used to ensure that when a user clicks on an item, it will smoothly scroll.
 */
const Headings = ({ headings, activeId }: Props) => (
  <ul className="text-slate-400 text-sm leading-6">
    {headings.map((heading) => (
      <li
        key={heading.id}
        className={classNames('border-l-2 py-1', {
          'text-blue-500': heading.id === activeId,
          'pl-2': heading.level === 2,
          'pl-3': heading.level === 3,
          'pl-4': heading.level === 4,
          'pl-5': heading.level === 5,
          'pl-6': heading.level === 6,
          'border-l-gray-300 dark:border-l-gray-50': heading.id !== activeId,
          'border-l-blue-500 dark:border-l-blue-500': heading.id === activeId,
          'bg-blue-50 dark:bg-slate-800': heading.id === activeId,
        })}
      >
        <a
          className={classNames('block', {
            'text-blue-500 dark:text-white font-semibold': heading.id === activeId,
            'hover:text-slate-800 dark:hover:text-slate-100': heading.id !== activeId,
          })}
          href={`#${heading.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.querySelector(`#${heading.id}`)?.scrollIntoView({
              behavior: 'smooth',
            });
          }}
        >
          {heading.title}
        </a>
      </li>
    ))}
  </ul>
);

function getHeaders() {
  return Array.from(document.querySelectorAll(SELECTOR)).filter((e) => {
    return !e.classList.contains('title');
  }) as HTMLHeadingElement[];
}

function useHeaders() {
  if (!onClient) return { activeId: '', headings: [] };
  const [activeId, setActiveId] = useState<string>();
  const headingsSet = useRef<Set<HTMLHeadingElement>>(new Set());
  const { observer } = useIntersectionObserver(setActiveId);
  const [elements, setElements] = useState<HTMLHeadingElement[]>([]);

  useEffect(() => {
    // We have to look at the document changes for reloads/mutations
    const main = document.querySelector('main');
    const mutations = new MutationObserver(
      throttle(() => setElements(getHeaders()), 500),
    );
    if (main)
      mutations.observe(main, { attributes: true, childList: true, subtree: true });
    return () => mutations.disconnect();
  }, []);

  useEffect(() => {
    // Re-observe all elements when the observer changes
    Array.from(elements).map((e) => observer.current?.observe(e));
  }, [observer]);

  elements.forEach((e) => {
    if (headingsSet.current.has(e)) return;
    observer.current?.observe(e);
    headingsSet.current.add(e);
  });

  const headings = elements.map((heading) => {
    const { innerText: title, id } = heading;
    return { title, id, level: Number(heading.tagName.slice(1)) };
  });

  return { activeId, headings };
}

const useIntersectionObserver = (setActiveId: (id: string) => void) => {
  const onScreen = useRef<Set<HTMLHeadingElement>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);
  if (!onClient) return { observer };
  useEffect(() => {
    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        onScreen.current[entry.isIntersecting ? 'add' : 'delete'](
          entry.target as HTMLHeadingElement,
        );
      });

      const active = [...onScreen.current].sort((a, b) => a.offsetTop - b.offsetTop)[0];
      if (active) setActiveId(active.id);
    };
    const o = new IntersectionObserver(callback);
    observer.current = o;
    return () => o.disconnect();
  }, [setActiveId]);
  return { observer };
};

export const TableOfContents = () => {
  const { headings, activeId } = useHeaders();
  if (headings.length <= 1) return <nav suppressHydrationWarning />;
  return (
    <nav
      aria-label="Table of Contents"
      suppressHydrationWarning
      className="fixed not-prose z-20 top-[3.8125rem] bottom-0 right-[max(0px,calc(50%-45rem))] w-[18rem] py-10 px-8 overflow-y-auto hidden xl:block"
    >
      <h5 className="text-slate-900 mb-4 text-sm leading-6 dark:text-slate-100 uppercase">
        In this article
      </h5>
      {onClient && <Headings headings={headings} activeId={activeId} />}
    </nav>
  );
};
