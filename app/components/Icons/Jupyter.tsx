import classnames from 'classnames';
import { useTheme } from '../theme';
import JupyterLogo from './jupyter.svg';
import JupyterGreyLogo from './jupyter-grey.svg';

export const Jupyter = ({
  className,
  jupyter,
}: {
  className?: string;
  jupyter: boolean;
}) => {
  const { isDark } = useTheme();
  if (!jupyter) return null;
  return (
    <div className={classnames('not-prose px-1', className)} title="Jupyter Notebook">
      <img src={isDark ? JupyterGreyLogo : JupyterLogo} alt="Juyter Logo" width="21" />
    </div>
  );
};
