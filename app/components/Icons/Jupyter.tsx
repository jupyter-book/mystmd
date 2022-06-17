import classnames from 'classnames';
import JupyterLogo from './jupyter.svg';

export const Jupyter = ({
  className,
  jupyter,
}: {
  className?: string;
  jupyter: boolean;
}) => {
  if (!jupyter) return null;
  return (
    <div
      className={classnames('not-prose px-1 dark:invert', className)}
      title="Jupyter Notebook"
    >
      <img src={JupyterLogo} alt="Juyter Logo" width="21" />
    </div>
  );
};
