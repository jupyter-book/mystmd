import classNames from 'classnames';
import { ExclamationIcon } from '@heroicons/react/outline';
import type { InlineMath, Math } from 'myst-spec';
import { InlineError } from './inlineError';
import { HashLink } from './heading';
import type { NodeRenderer } from './types';

// function Math({ value, html }: { value: string; html: string }) {
//   const [loaded, setLoaded] = useState(false);
//   const ref = useRef<HTMLDivElement | null>(null);
//   useEffect(() => {
//     import('katex').then(() => {
//       setLoaded(true);
//     });
//   }, []);
//   useEffect(() => {
//     if (!loaded) return;
//     import('katex').then(({ default: katex }) => {
//       if (!ref.current) return;
//       katex.render(value, ref.current, { displayMode: true });
//     });
//   }, [loaded, ref]);
//   return (
//     <>
//       {(typeof document === 'undefined' || !loaded) && (
//         <div dangerouslySetInnerHTML={{ __html: html }} />
//       )}
//       {loaded && <div ref={ref} />}
//     </>
//   );
// }

type MathLike = (InlineMath | Math) & {
  error?: boolean;
  message?: string;
  html?: string;
};

const mathRenderer: NodeRenderer<MathLike> = (node) => {
  if (node.type === 'math') {
    if (node.error || !node.html) {
      return (
        <pre key={node.key} title={node.message}>
          <span className="text-red-500">
            <ExclamationIcon className="inline h-[1em] mr-1" />
            {node.message}
            {'\n\n'}
          </span>
          {node.value}
        </pre>
      );
    }
    return (
      <div key={node.key} id={node.identifier || node.key} className={classNames('flex group')}>
        <div
          dangerouslySetInnerHTML={{ __html: node.html }}
          className="overflow-x-auto flex-grow"
        />
        {node.enumerator && (
          <div className="flex-none text-right m-0 pl-2 self-center relative">
            <span>({node.enumerator})</span>
            <HashLink id={node.identifier || node.key} align="right" kind="Equation" />
          </div>
        )}
      </div>
    );
  }
  if (node.error || !node.html) {
    return <InlineError key={node.key} value={node.value} message={node.message} />;
  }
  return <span key={node.key} dangerouslySetInnerHTML={{ __html: node.html }} />;
  // return <Math key={node.key} html={node.html} value={node.value as string} />;
};

const MATH_RENDERERS = {
  math: mathRenderer,
  inlineMath: mathRenderer,
};

export default MATH_RENDERERS;
