import { useEffect, useRef } from 'react';

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
