import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import light from 'react-syntax-highlighter/dist/cjs/styles/hljs/xcode';
import dark from 'react-syntax-highlighter/dist/cjs/styles/hljs/vs2015';
import { GenericNode } from 'mystjs';
import { useTheme } from '../theme';
import { NodeTypes } from 'myst-util-to-react';

type Props = {
  children: string;
  lang?: string;
  emphasizeLines?: number[];
};

export function CodeBlock(props: Props) {
  const { isLight } = useTheme();
  const { children, lang, emphasizeLines } = props;
  const highlightLines = new Set(emphasizeLines);
  return (
    <SyntaxHighlighter
      language={lang}
      showLineNumbers
      style={isLight ? light : dark}
      wrapLines
      lineNumberContainerStyle={{
        // This stops page content shifts
        display: 'inline-block',
        float: 'left',
        minWidth: '1.25em',
        paddingRight: '1em',
        textAlign: 'right',
        userSelect: 'none',
        borderLeft: '4px solid transparent',
      }}
      lineProps={(line) => {
        return highlightLines.has(line)
          ? ({
              'data-line-number': `${line}`,
              'data-highlight': 'true',
            } as any)
          : ({ 'data-line-number': `${line}` } as any);
      }}
      customStyle={{ padding: '0.8rem 0' }}
    >
      {children}
    </SyntaxHighlighter>
  );
}

export const codeRenderers: NodeTypes = {
  code(node: GenericNode) {
    return (
      <div key={node.key} className="rounded shadow-md dark:shadow-2xl my-8">
        <CodeBlock lang={node.lang} emphasizeLines={node.emphasizeLines}>
          {node.value || ''}
        </CodeBlock>
      </div>
    );
  },
};
