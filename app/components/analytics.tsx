import { AnalyticsConfig } from '../utils';

const getGoogleAnalyticsScript = (tag: string) =>
  `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${tag}');`;

export function Analytics({ analytics }: { analytics?: AnalyticsConfig }) {
  return (
    <>
      {analytics?.plausible && (
        <script
          defer
          data-domain={analytics.plausible}
          src="https://plausible.io/js/plausible.js"
        ></script>
      )}
      {analytics?.google && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${analytics.google}`}
          ></script>
          <script
            dangerouslySetInnerHTML={{
              __html: getGoogleAnalyticsScript(analytics.google),
            }}
          />
        </>
      )}
    </>
  );
}
