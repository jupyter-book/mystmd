import classNames from 'classnames';

type Props = {
  children?: React.ReactNode;
  allSafe?: boolean;
  hasError?: boolean;
  className?: string;
};

export function OutputBlock(props: Props) {
  const { children, allSafe, hasError, className } = props;

  return (
    <div
      suppressHydrationWarning={!allSafe}
      className={classNames(
        `relative group not-prose overflow-auto 
        rounded shadow-md dark:shadow-2xl dark:shadow-neutral-900 
        text-sm mb-8 border border-l-4 border-gray-200 dark:border-gray-800`,
        className,
        {
          'p-2.5': allSafe,
          'border-l-red-400 dark:border-l-red-400 background-red-100': hasError,
          'border-l-emerald-400 dark:border-l-emerald-400': !hasError,
        },
      )}
    >
      {children}
    </div>
  );
}
