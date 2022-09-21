import { Outlet } from '@remix-run/react';
import { useNavigationHeight } from '../hooks';
import { DEFAULT_NAV_HEIGHT, DocumentOutline } from '../components';
import { ErrorProjectNotFound } from './ErrorProjectNotFound';
import { useHideDesignElement } from '@curvenote/ui-providers';

export function FolderPage({ top = DEFAULT_NAV_HEIGHT }: { top?: number }) {
  const { ref, height } = useNavigationHeight();
  const [hide_outline] = useHideDesignElement('hide_outline');
  return (
    <main ref={ref} className="article-content">
      <Outlet />
      {!hide_outline && <DocumentOutline top={top} height={height} />}
    </main>
  );
}

export function FolderPageCatchBoundary() {
  return (
    <main className="error-content">
      <ErrorProjectNotFound />
    </main>
  );
}
