---
title: Deploy on an Apache web server (httpd)
short_title: Apache httpd
description: Deploy your MyST site on Apache httpd
---

Once you have built a static version of your MyST project via `myst build --html`, it can be served on an any common web server: [Apache web server (httpd)](https://httpd.apache.org), [nginx](https://nginx.org/), or others.

For example, let's assume your web server's base URL is `http://www.example.com` and it uses `/var/www/html` as the file server root (`DocumentRoot` in httpd). If you copy the `_build/html/` directory to `/var/www/html/my-project` using

```shell
cp -r _build/html /var/www/html/my-project
```

then the resulting URL would be `http://www.example.com/my-project`, and you are all set if you have [configured the base URL](deployment.md#deploy-base-url).