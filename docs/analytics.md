---
title: Adding Analytics to your MyST Website
short_title: Analytics
description: Add Google Analytics or Plausible to your MyST website with a site configuration key.
thumbnail: ./thumbnails/analytics.png
---

By default, MyST sites contain no tracking cookies or analytics. 
However, we offer support for two analytics tracking systems:

1. [Google Analytics](https://marketingplatform.google.com/about/analytics/); and
2. [Plausible](https://plausible.io/), which is privacy-friendly alternative to Google.

These are set using template specific options in your site configuration using either an `analytics_google` or an `analytics_plausible` key.

## Google Analytics

Use the `site.options.analytics_google` configuration, with the contents being your **Measurement ID** (G-XXXXXX) or **Tracking ID** (UA-XXXXXX).

```yaml
version: 1
site:
  options:
    analytics_google: UA-XXXXX # Measurement ID or Tracking ID
```

See [Google Analytics docs](https://developers.google.com/analytics/devguides/collection/gtagjs) for more information on how to find this Measurement ID.

## Plausible

Use the `site.options.analytics_plausible` configuration, with the contents being the **domain** you are tracking.

```yaml
version: 1
site:
  options:
    analytics_plausible: mystmd.org # Domain(s) to track
```

See [Plausible docs](https://plausible.io/docs/plausible-script) for more information on how to find the domain. Note, you only copy in the contents of: `data-domain="COPY_THIS"`, which can be a comma-separated list for multiple domains.

## Testing your integration

Run `myst start` and view the page source. The analytics section should be in the `<head>` section of the HTML, you should also start to see real-time tracking in your dashboard.
