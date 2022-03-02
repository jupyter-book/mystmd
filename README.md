# Curvespace

Curvespace is designed for modern technical communication that is interactive, computational, and linked to data.
You can create and serve a local website to write your documentation, paper, thesis, or blog.

- [Curvenote Docs](https://cli.curvenote.dev)

## Development

To run your app locally, make sure your project's local dependencies are installed:

```sh
npm install
```

Afterwards, start the development server like so:

```sh
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000) and you should be ready to go!

## Architecture

Curvespace uses [Remix](https://remix.run) for the server, to learn more see the [Remix Docs](https://remix.run/docs).
We have chosen Remix as it is blazing fast, built on web-standards, and can also work without Javascript.

## Deployment

After having run the `create-remix` command and selected "Vercel" as a deployment target, you only need to [import your Git repository](https://vercel.com/new) into Vercel, and it will be deployed.

If you'd like to avoid using a Git repository, you can also deploy the directory by running [Vercel CLI](https://vercel.com/cli):

```sh
npm i -g vercel
vercel
```

It is generally recommended to use a Git repository, because future commits will then automatically be deployed by Vercel, through its [Git Integration](https://vercel.com/docs/concepts/git).
