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
      className={classnames(
        'not-prose mx-[2px] px-[2px] dark:bg-gray-200 py-[2px] dark:rounded',
        className,
      )}
      title="Jupyter Notebook"
    >
      <img src={JupyterLogo} alt="Juyter Logo" width="21" />
    </div>
  );
};
