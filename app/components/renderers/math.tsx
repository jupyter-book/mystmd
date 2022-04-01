import { NodeRenderer } from 'myst-util-to-react';

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

const mathBlock =
  (displayMode: boolean): NodeRenderer =>
  (node) => {
    if (displayMode) {
      return <div key={node.key} dangerouslySetInnerHTML={{ __html: node.html }} />;
    }
    return <span key={node.key} dangerouslySetInnerHTML={{ __html: node.html }} />;
    // return <Math key={node.key} html={node.html} value={node.value as string} />;
  };

export const mathRenderers = {
  math: mathBlock(true),
  inlineMath: mathBlock(false),
};
