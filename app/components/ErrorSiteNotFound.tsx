export function ErrorSiteNotFound({ url }: { url: string }) {
  return (
    <>
      <h1>No site at this url</h1>
      <p>No website is available at this url, please double check the url.</p>
      <pre>{url}</pre>
      <h3>What's next?</h3>
      <p>
        If you are expecting to see <span className="font-semibold">your website</span>{' '}
        here and you think that something has gone wrong, please send an email to{' '}
        <a
          href={`mailto:support@curvenote.com?subject=Website%20Unavailable&body=${encodeURIComponent(
            `My website is deployed a ${url}, but is not available. 😥`,
          )}`}
        >
          support@curvenote.com
        </a>
        , or{' '}
        <a href="https://slack.curvenote.dev">let us know on our community slack</a>,
        and we'll help out.
      </p>
      <p>
        Or create a new temporary website from Markdown and Jupyter Notebooks using{' '}
        <a href="https://try.curvenote.com">try.curvenote.com</a>.
      </p>
      <p>
        Or find out more about Curvenote&apos;s scientific writing, collaboration and
        publishing tools at <a href="https://curvenote.com">curvenote.com</a>.
      </p>
    </>
  );
}
