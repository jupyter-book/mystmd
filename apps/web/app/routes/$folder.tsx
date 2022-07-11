import { Outlet } from '@remix-run/react';
import { DocumentOutline, ErrorProjectNotFound, useNavigationHeight } from '@curvenote/site';

export default function Folder() {
  const { ref, height, top } = useNavigationHeight(60);
  return (
    <>
      <main ref={ref} className="article-content">
        <Outlet />
        <DocumentOutline top={top} height={height} />
      </main>
    </>
  );
}

export function CatchBoundary() {
  return (
    <div className="mt-16">
      <main className="error-content">
        <ErrorProjectNotFound />
      </main>
    </div>
  );
}
