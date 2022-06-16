import { Link } from '@remix-run/react';

export function ErrorProjectNotFound() {
  return (
    <>
      <h1>Project Not Found</h1>
      <p>
        Take me <Link to="/">home</Link>.
      </p>
    </>
  );
}
