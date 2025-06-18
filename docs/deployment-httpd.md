---
title: Deploy on an Apache web server (httpd)
short_title: Apache httpd
description: Deploy your MyST site on Apache httpd
---

Once you have built a static version of your MyST project via `myst build --html`, it can be served on an [Apache web server (httpd)](https://httpd.apache.org) instance.

For example, let's assume your web server's base URL is `http://www.example.com`, it uses `/var/www/html` as its `DocumentRoot`. If you copy the `_build/html/` directory to `/var/www/html/my-project`, then the URL would be `http://www.example.com/my-project`:

```shell
cp -r _build/html /var/www/html/my-project
```

::::{warning} Enable automatic `.html` file suffixes
`myst build --html` will produce HTML-formatted files that have `.html` as their suffix for `.md` and (if you choose to `execute` Jupyter notebooks) `.ipynb` files that you list in your project's [table of contents](table-of-contents.md).

However, the links that are generated will not have `.html` as part of their HREFs. You will need to enable the [MultiViews](https://httpd.apache.org/docs/2.4/content-negotiation.html#multiviews) option in your Apache httpd configuration file to make these links work properly.

For example, assuming your httpd configuration file lives in `/etc/httpd/conf/httpd.conf`, add the following stanza, and then reload/restart your Apache web server:

```
<Directory "/var/www/html/">
    Options MultiViews
</Directory>
```
:::{tip} 
You may also need to add the line: 

```
LoadModule negotiation_module modules/mod_negotiation.so
```
to your `httpd` configuration. In RHEL-like Linux distributions, this line is already included in the `httpd` RPM package, in `/etc/httpd/conf.modules.d/00-base.conf`.
:::
::::
