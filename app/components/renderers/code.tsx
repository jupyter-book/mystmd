import type { Code } from 'myst-spec';
import { NodeRenderer } from 'myst-util-to-react';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import light from 'react-syntax-highlighter/dist/cjs/styles/hljs/xcode';
import dark from 'react-syntax-highlighter/dist/cjs/styles/hljs/vs2015';
import { useTheme } from '../theme';

type Props = {
  children: string;
  lang?: string;
  showLineNumbers?: boolean;
  emphasizeLines?: number[];
};

export function CodeBlock(props: Props) {
  const { isLight } = useTheme();
  const { children, lang, emphasizeLines, showLineNumbers } = props;
  const highlightLines = new Set(emphasizeLines);
  return (
    <SyntaxHighlighter
      language={lang}
      showLineNumbers={showLineNumbers}
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
        if (typeof line === 'boolean') return {};
        return highlightLines.has(line)
          ? ({
              'data-line-number': `${line}`,
              'data-highlight': 'true',
            } as any)
          : ({ 'data-line-number': `${line}` } as any);
      }}
      customStyle={{ padding: '0.8rem' }}
    >
      {children}
    </SyntaxHighlighter>
  );
}

const code: NodeRenderer<Code> = (node) => {
  return (
    <div
      key={node.key}
      className="not-prose rounded shadow-md dark:shadow-2xl dark:shadow-neutral-900 my-8 text-sm border border-l-4 border-l-blue-400 border-gray-200 dark:border-l-blue-400 dark:border-gray-800 overflow-scroll"
    >
      <CodeBlock
        lang={node.lang}
        emphasizeLines={node.emphasizeLines}
        showLineNumbers={node.showLineNumbers}
      >
        {node.value || ''}
      </CodeBlock>
    </div>
  );
};

export const codeRenderers = {
  code,
};
