import type { Code } from 'myst-spec';
import { NodeRenderer } from 'myst-util-to-react';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import light from 'react-syntax-highlighter/dist/cjs/styles/hljs/xcode';
import dark from 'react-syntax-highlighter/dist/cjs/styles/hljs/vs2015';
import { useTheme } from '../theme';
import { useEffect, useRef, useState } from 'react';
import { copyTextToClipboard } from '~/utils';
import classNames from 'classnames';
import { CheckIcon } from '@heroicons/react/outline';
import { DuplicateIcon } from '@heroicons/react/solid';

type Props = {
  value: string;
  lang?: string;
  showLineNumbers?: boolean;
  emphasizeLines?: number[];
  className?: string;
};

export function CodeBlock(props: Props) {
  const { isLight } = useTheme();
  const { value, lang, emphasizeLines, showLineNumbers, className } = props;
  const highlightLines = new Set(emphasizeLines);
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!showCopied) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowCopied(false), 1500);
  }, [showCopied]);

  return (
    <div className={classNames('relative group not-prose overflow-auto', className)}>
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
        {value}
      </SyntaxHighlighter>
      <div className="absolute hidden top-1 right-1 group-hover:block">
        <button
          className={classNames(
            'p-1 cursor-pointer transition-color duration-200 ease-in-out',
            {
              'text-primary-500 border-primary-500': !showCopied,
              'text-success border-success ': showCopied,
            },
          )}
          title={showCopied ? 'Copied' : 'Copy to clipboard'}
          onClick={() => {
            copyTextToClipboard(value)
              .then(() => setShowCopied(true))
              .catch(() => {
                console.log('Failed to copy');
              });
          }}
        >
          {showCopied ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <DuplicateIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

const code: NodeRenderer<Code> = (node) => {
  return (
    <CodeBlock
      key={node.key}
      className="rounded shadow-md dark:shadow-2xl dark:shadow-neutral-900 my-8 text-sm border border-l-4 border-l-blue-400 border-gray-200 dark:border-l-blue-400 dark:border-gray-800"
      value={node.value || ''}
      lang={node.lang}
      emphasizeLines={node.emphasizeLines}
      showLineNumbers={node.showLineNumbers}
    />
  );
};

export const codeRenderers = {
  code,
};
