import type { ISession } from '../session/types';
// import { buildDocx } from './docx';
// import { buildPdf } from './pdf';
// import { buildTex } from './tex';
// import { buildWeb } from './web';

export type BuildOpts = {
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  web?: boolean;
  checkLinks?: boolean;
  clean?: boolean;
  strict?: boolean;
  writeToc?: boolean;
};

export function noBuildTargets(opts: BuildOpts) {
  const { docx, pdf, tex, web } = opts;
  return !docx && !pdf && !tex && !web;
}

export function build(session: ISession, opts: BuildOpts) {
  const buildAll = noBuildTargets(opts);
  const { docx, pdf, tex, web } = opts;
  // if (buildAll || docx) buildDocx(session, opts);
  // if (buildAll || pdf) buildPdf(session, opts);
  // if (buildAll || tex) buildTex(session, opts);
  // if (buildAll || web) buildWeb(session, opts);
  console.log(opts);
  return;
}
