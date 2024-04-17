---
title: Deploying to Netlify
short_title: Netlify
description: Deploy your MyST site to Netlify
---

% Adapted from: https://jupyterbook.org/en/stable/publish/netlify.html#step-2-add-the-command-to-install-and-build-your-book

[Netlify](https://www.netlify.com/) is a continuous deployment service that can
**automatically build an updated copy of your project** as you push new content.
It can be used across git clients including GitHub, GitLab, and Bitbucket.
Although Netlify has both free and paid tiers, the build process is the same across both.
Importantly, the free tier only allows for 100GB of bandwidth usage per month across all of your Netlify built projects[^pricing].

[^pricing]: If your project will be used by a large audience, or if you're creating many projects, you might want to consider registering for [a paid account](https://www.netlify.com/pricing/).

These instructions assume you're keeping your source files under version control,
rather than the built project HTML.

In order to use Netlify, you'll need to [create an account](https://app.netlify.com/signup).
Here, we'll walk through connecting your project to Netlify's continuous deployment services using their UI.
You can also check out their [documentation on continuous deployment](https://www.netlify.com/docs/continuous-deployment/).

## Step 1: Connect your GitHub repo to Netlify

After you've created a Netlify account, you'll need to log in.
The home page will be a dashboard of all sites you're currently building with Netlify.
We can then import a new site by clicking the "New Site from Git" button in the upper right.

This should launch [the site builder](https://app.netlify.com/start):

![Netlify site builder](./images/netlify-new-site.png)

Here, you can select the git client where your project is hosted.
For the purposes of this tutorial, we'll assume that your book is hosted on GitHub.

When you select the "GitHub" option, you'll be asked to grant permission for Netlify to access your GitHub account.
Authorizing access will take you to the next step of the build process, where you can select your project repository.

![Netlify continuous deployment](./images/netlify-cd.png)

## Step 2: Add the command to install and build your project

:::{note}
If your book content is not in the root of your repository, make sure you point to
where you will run the `myst build --html` command locally.
:::

Once you've selected the correct repository, you'll need to supply build instructions.
This is a command that Netlify runs before hosting your site. We'll use it to do the
following:

- Install `mystmd`
- Build your project's HTML

Put the following command in the _Build command_ section:

```bash
npm install -g mystmd && myst build --html
```

Finally, the _Publish directory_ should be `_build/html`.

You'll also need to select the appropriate branch to build your repository from.
In this example, we'll use the `main` branch.

![Netlify build command](./images/netlify-build-settings.png)

You can then select _Deploy site_ and wait for the site to build.
You'll be redirected to the site dashboard during the build process.

## Step 3: Updating your domain name

If your site has successfully built, it will be assigned a random domain name.
In order to have a more memorable address, you can update your site's name.

From the site dashboard, select _Domain settings_.
This will take you to a sub-menu, where you can choose to update your site name.

![Netlify configure domain](./images/netlify-domains.png)

You can enter a memorable, unique name here to describe your project!
Note that it will be prepended to `.netlify.com` so, `MY-BOOK` will become `MY-BOOK.netlify.com`.

You can also use a custom domain (i.e., one that you have purchased through a DNS registrar).
See the [Netlify documentation on custom domains](https://www.netlify.com/docs/custom-domains/) for more details on this process.

<!--
## Step 4: Adding Compute

You can also install dependencies for executing notebooks, this will require a few changes to your configuration above.

:::{warning}
The default Netlify Python environment is Python 2.7.
You should update the Python environment by including a `runtime.txt` file in your repository,
as detailed in [the Netlify documentation](https://www.netlify.com/docs/build-settings/#build-environment-variables).

For a full list of available environments,
please see the [Netlify build image details](https://github.com/netlify/build-image/blob/xenial/included_software.md#languages).
:::

:::{note}
Ensure that project's version in your `requirements.txt` file is at least
`0.7.0`.
:::
 -->
