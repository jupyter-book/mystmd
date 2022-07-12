import { Outlet } from '@remix-run/react';
import { useNavigationHeight } from '../hooks';
import { DEFAULT_NAV_HEIGHT, DocumentOutline } from '../components';
import { ErrorProjectNotFound } from './ErrorProjectNotFound';

export function FolderPage({ top = DEFAULT_NAV_HEIGHT }: { top?: number }) {
  const { ref, height } = useNavigationHeight();
  return (
    <main ref={ref} className="article-content">
      <Outlet />
      <DocumentOutline top={top} height={height} />
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
