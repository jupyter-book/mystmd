import fs from 'fs';
import path from 'path';
import { getMystTemplate, getSiteManifest, startServer } from '../../build';
import type { ISession } from '../../session';
import { makeExecutable } from 'myst-cli-utils';

export async function currentSiteRoutes(
  session: ISession,
  host: string,
  opts?: { defaultTemplate?: string },
) {
  const manifest = await getSiteManifest(session, opts);
  return manifest.projects
    ?.map((proj) => {
      const projSlug = proj.slug ? `/${proj.slug}` : '';
      return [
        `${host}${projSlug}`,
        ...proj.pages.map((page) => {
          return `${host}${projSlug}/${page.slug}`;
        }),
      ];
    })
    .flat();
}

export async function buildHtml(session: ISession, opts: any) {
  const htmlDir = path.join(session.buildPath(), 'html');
  const staticTxt = path.join(session.buildPath(), 'static.txt');
  fs.mkdirSync(htmlDir, { recursive: true });
  const routes = await currentSiteRoutes(session, 'https://localhost:3000', opts);
  if (!routes) throw Error('No routes found when building static site...');
  fs.writeFileSync(staticTxt, routes?.join('\n'));
  await startServer(session, opts);
  await makeExecutable(`wget -r -nH -i ${staticTxt} -P ${htmlDir}`, session.log)();
  fs.readdirSync(session.publicPath()).forEach((filename) => {
    const file = path.join(session.publicPath(), filename);
    if (fs.statSync(file).isDirectory()) return;
    fs.copyFileSync(file, path.join(htmlDir, filename));
  });
  const template = await getMystTemplate(session, opts);
  const templateBuildDir = path.join(template.templatePath, 'build');
  fs.readdirSync(templateBuildDir).forEach((filename) => {
    const file = path.join(templateBuildDir, filename);
    if (fs.statSync(file).isDirectory()) return;
    fs.copyFileSync(file, path.join(htmlDir, 'build', filename));
  });
  fs.rmSync(staticTxt);
  // kill server?
}
