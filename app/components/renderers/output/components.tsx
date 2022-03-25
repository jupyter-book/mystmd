import { useEffect, useRef } from 'react';
import { useLongContent } from './hooks';

export const MaybeLongContent = ({
  content,
  path,
  render,
}: {
  content: string;
  path?: string;
  render: (content: string) => JSX.Element;
}) => {
  const { error, data } = useLongContent(content, path);
  if (error) {
    return <div className="text-red-500">Error loading content: {error.message}</div>;
  }
  if (!data) {
    return <div>Loading output area....</div>;
  }
  return <div>{render(data.content)}</div>;
};

export const DangerousHTML = ({ content, ...rest }: { content: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!content || !ref.current) return;
    const el = document.createRange().createContextualFragment(content);
    ref.current.innerHTML = '';
    ref.current.appendChild(el);
  }, [content, ref]);

  return <div {...rest} ref={ref} />;
};
