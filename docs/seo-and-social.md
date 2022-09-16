---
title: Search Engines and Social
description: How to have your site content indexed by Google and support rich link previews.
---

The content that you create for a MyST site is static, and served to users as a server-side rendered application.
This means that all the HTML is accessible on request by a search engine crawlers, as well as is speedy and accessible for users when they browse.

```{seealso}
Search engines often rank content higher that is mobile friendly, have a fast page load, and satisfy accessibility requirements. MyST sites are designed for mobile and desktop sites, accessibility and speedy page loads; read more about [accessibility and performance](./accessibility-and-performance.md).
```

## Social Previews

Social previews show up on tools like Twitter, Slack, or many other places that you might share a link to your content.
For these to work, they require a `title`, `description` and an optional `thumbnail`. These can be set directly in your document frontmatter.

```yaml
title: Search Engines and Social
description: How to have your site content indexed by Google and support rich link previews.
thumbnail: ./thumbnails/seo-and-social.png
```

If you do not specify an image the first image in the content of a page will be selected. If you explicitly do not want an image, set `thumbnail` to `null`. The thumbnail is also optimized (i.e. to use `webP` over `png` to save [up to 34%](https://developers.google.com/speed/webp) on each image) and resized for use in listings and index pages.

The thumbnail, title and description for your document will also show up in site links in a hover tooltip. For example, here is a link to [](./interactive-notebooks.ipynb).

## robots.txt

A `robots.txt` file allows you to allow or disallow crawling from search engines, for example from [Googlebot](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
By default the `robots.txt` is set to `allow` in the site configuration, which creates this file when you visit your URL at [robots.txt](/robots.txt).

```text
# https://www.robotstxt.org/robotstxt.html

User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
```

To disallow querying from robots, you can turn the `robots: disallow`

```yaml
site:
  robots: disallow
```

This will turn the `Allow: /` to `Disallow: /`, which will indicate to search engine crawlers to not crawl any URLs.
This is a good setting for trasient sites or sites that are showing, for example, changes on a pull-request.

## sitemap.xml

The `sitemap.xml` is always created and is accessible through [sitemap.xml](/sitemap.xml), which lists all of the pages in your site, including any nested projects. This XML Sitemap is generated automatically to make your content more visible for search engines.

To make the sitemaps easy to read by humans as well as machines, we have included a `sitemap_style.xsl` to style the data and give quick analytics about the number of pages on the site.
