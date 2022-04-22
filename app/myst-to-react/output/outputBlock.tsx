import classNames from 'classnames';

type Props = {
  children?: React.ReactNode;
  allSafe?: boolean;
  hasError?: boolean;
  className?: string;
};

export function OutputBlock(props: Props) {
  const { children, allSafe, className } = props;

  return (
    <div
      suppressHydrationWarning={!allSafe}
      className={classNames('relative group not-prose overflow-auto mb-8', className, {
        'p-2.5': allSafe,
        'pl-0.5': !allSafe,
      })}
    >
      {children}
    </div>
  );
}
