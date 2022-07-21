import classNames from 'classnames';
import throttle from 'lodash.throttle';
import { useCallback, useEffect, useRef, useState } from 'react';

const SELECTOR = [1, 2, 3, 4, 5, 6].map((n) => `main h${n}`).join(', ');
const HIGHLIGHT_CLASS = 'highlight';

const onClient = typeof document !== 'undefined';

type Heading = {
  id: string;
  title: string;
  titleHTML: string;
  level: number;
};
type Props = {
  headings: Heading[];
  activeId?: string;
  highlight?: () => void;
};
/**
 * This renders an item in the table of contents list.
 * scrollIntoView is used to ensure that when a user clicks on an item, it will smoothly scroll.
 */
const Headings = ({ headings, activeId, highlight }: Props) => (
  <ul className="text-slate-400 text-sm leading-6">
    {headings.map((heading) => (
      <li
        key={heading.id}
        className={classNames('border-l-2', {
          'text-blue-600': heading.id === activeId,
          'border-l-gray-300 dark:border-l-gray-50': heading.id !== activeId,
          'border-l-blue-500 dark:border-l-blue-500': heading.id === activeId,
          'bg-blue-50 dark:bg-slate-800': heading.id === activeId,
        })}
      >
        <a
          className={classNames('block p-1 pl-2', {
            'text-blue-600 dark:text-white font-semibold': heading.id === activeId,
            'hover:text-slate-800 dark:hover:text-slate-100 pr-2': heading.id !== activeId,
            'pl-3': heading.level === 2,
            'pl-4': heading.level === 3,
            'pl-5': heading.level === 4,
            'pl-6': heading.level === 5,
            'pl-7': heading.level === 6,
          })}
          href={`#${heading.id}`}
          onClick={(e) => {
            e.preventDefault();
            const el = document.querySelector(`#${heading.id}`);
            if (!el) return;
            getHeaders().forEach((h) => h.classList.remove(HIGHLIGHT_CLASS));
            el.classList.add(HIGHLIGHT_CLASS);
            highlight?.();
            el.scrollIntoView({ behavior: 'smooth' });
          }}
          // Note that the title can have math in it!
          dangerouslySetInnerHTML={{ __html: heading.titleHTML }}
        />
      </li>
    ))}
  </ul>
);

function getHeaders(): HTMLHeadingElement[] {
  const headers = Array.from(document.querySelectorAll(SELECTOR)).filter((e) => {
    const parent = e.closest('.exclude-from-outline');
    return !(e.classList.contains('title') || parent);
  });
  return headers as HTMLHeadingElement[];
}

function useHeaders() {
  if (!onClient) return { activeId: '', headings: [] };
  const onScreen = useRef<Set<HTMLHeadingElement>>(new Set());
  const [activeId, setActiveId] = useState<string>();
  const headingsSet = useRef<Set<HTMLHeadingElement>>(new Set());

  const highlight = useCallback(() => {
    const current = [...onScreen.current];
    const highlighted = current.reduce((a, b) => {
      if (a) return a;
      if (b.classList.contains('highlight')) return b.id;
      return null;
    }, null as string | null);
    const active = [...onScreen.current].sort((a, b) => a.offsetTop - b.offsetTop)[0];
    if (highlighted || active) setActiveId(highlighted || active.id);
  }, []);

  const { observer } = useIntersectionObserver(highlight, onScreen.current);
  const [elements, setElements] = useState<HTMLHeadingElement[]>([]);

  const render = throttle(() => setElements(getHeaders()), 500);
  useEffect(() => {
    // We have to look at the document changes for reloads/mutations
    const main = document.querySelector('main');
    const mutations = new MutationObserver(render);
    // Fire when added to the dom
    render();
    if (main) {
      mutations.observe(main, { attributes: true, childList: true, subtree: true });
    }
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

  const headings: Heading[] = elements
    .map((heading) => {
      return {
        level: Number(heading.tagName.slice(1)),
        id: heading.id,
        text: heading.querySelector('.heading-text'),
      };
    })
    .filter((h) => !!h.text)
    .map(({ level, text, id }) => {
      const { innerText: title, innerHTML: titleHTML } = text as HTMLSpanElement;
      return { title, titleHTML, id, level };
    });

  return { activeId, highlight, headings };
}

const useIntersectionObserver = (highlight: () => void, onScreen: Set<HTMLHeadingElement>) => {
  const observer = useRef<IntersectionObserver | null>(null);
  if (!onClient) return { observer };
  useEffect(() => {
    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        onScreen[entry.isIntersecting ? 'add' : 'delete'](entry.target as HTMLHeadingElement);
      });
      highlight();
    };
    const o = new IntersectionObserver(callback);
    observer.current = o;
    return () => o.disconnect();
  }, [highlight, onScreen]);
  return { observer };
};

export const DocumentOutline = ({ top, height }: { top?: number; height?: number }) => {
  const { activeId, headings, highlight } = useHeaders();
  if (height && height < 50) return null;
  if (headings.length <= 1) return <nav suppressHydrationWarning />;
  return (
    <nav
      aria-label="Document Outline"
      suppressHydrationWarning
      className="document-outline not-prose transition-opacity"
      style={{
        top: top ?? 0,
        height:
          typeof document === 'undefined' || (height && height > window.innerHeight)
            ? undefined
            : height,
        opacity: height && height > 300 ? undefined : 0,
      }}
    >
      <div className="text-slate-900 mb-4 text-sm leading-6 dark:text-slate-100 uppercase">
        In this article
      </div>
      {onClient && <Headings headings={headings} activeId={activeId} highlight={highlight} />}
    </nav>
  );
};
