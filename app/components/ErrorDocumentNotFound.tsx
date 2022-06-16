import { Link } from '@remix-run/react';

export function ErrorDocumentNotFound() {
  return (
    <>
      <h1>Document Not Found</h1>
      <p>
        Take me <Link to="/">home</Link>.
      </p>
    </>
  );
}
