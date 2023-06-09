import path from 'path';
import type { Root } from 'mdast';
import { tic } from 'myst-cli-utils';
import type { References } from 'myst-common';
import { SourceFileKind } from 'myst-common';
import type { LinkTransformer } from 'myst-transforms';
import {
  basicTransformationsPlugin,
  htmlPlugin,
  footnotesPlugin,
  ReferenceState,
  MultiPageReferenceState,
  resolveReferencesTransform,
  mathPlugin,
  codePlugin,
  enumerateTargetsPlugin,
  keysTransform,
  linksTransform,
  MystTransformer,
  WikiTransformer,
  GithubTransformer,
  RRIDTransformer,
  DOITransformer,
  joinGatesPlugin,
  glossaryPlugin,
  abbreviationPlugin,
} from 'myst-transforms';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { getPageFrontmatter, processPageFrontmatter } from '../frontmatter.js';
import { selectors } from '../store/index.js';
import { watch } from '../store/reducers.js';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/index.js';
import type { RendererData } from '../transforms/types.js';

import {
  checkLinksTransform,
  embedDirective,
  importMdastFromJson,
  includeFilesDirective,
  liftCodeMetadataToBlock,
  transformLinkedDOIs,
  transformOutputs,
  transformCitations,
  transformImages,
  transformImageFormats,
  transformThumbnail,
  StaticFileTransformer,
  inlineExpressionsPlugin,
} from '../transforms/index.js';
import type { ImageExtensions } from '../utils/index.js';
import { logMessagesFromVFile } from '../utils/index.js';
import { combineCitationRenderers } from './citations.js';
import { bibFilesInDir, selectFile } from './file.js';
import { loadIntersphinx } from './intersphinx.js';

const LINKS_SELECTOR = 'link,card,linkBlock';

const htmlHandlers = {
  comment(h: any, node: any) {
    // Prevents HTML comments from showing up as text in web
    // TODO: Remove once this is landed in mystjs
    const result = h(node, 'comment');
    (result as any).value = node.value;
    return result;
  },
};

export type PageReferenceStates = {
  state: ReferenceState;
  file: string;
  url: string | null;
  dataUrl: string | null;
}[];

export type TransformFn = (
  session: ISession,
  opts: Parameters<typeof transformMdast>[1],
) => Promise<void>;

export async function transformMdast(
  session: ISession,
  opts: {
    file: string;
    imageWriteFolder: string;
    projectPath?: string;
    projectSlug?: string;
    pageSlug?: string;
    imageAltOutputFolder?: string;
    imageExtensions?: ImageExtensions[];
    watchMode?: boolean;
    extraTransforms?: TransformFn[];
    minifyMaxCharacters?: number;
    index?: string;
  },
) {
  const {
    file,
    imageWriteFolder,
    projectPath,
    pageSlug,
    projectSlug,
    imageAltOutputFolder,
    imageExtensions,
    extraTransforms,
    watchMode = false,
    minifyMaxCharacters,
    index,
  } = opts;
  const toc = tic();
  const { store, log } = session;
  const cache = castSession(session);
  if (!cache.$mdast[file]) return;
  const { mdast: mdastPre, kind, frontmatter: preFrontmatter } = cache.$mdast[file].pre;
  if (!mdastPre) throw new Error(`Expected mdast to be parsed for ${file}`);
  log.debug(`Processing "${file}"`);
  // Use structuredClone in future (available in node 17)
  const mdast = JSON.parse(JSON.stringify(mdastPre)) as Root;
  const frontmatter = preFrontmatter
    ? processPageFrontmatter(session, preFrontmatter, projectPath)
    : getPageFrontmatter(session, mdast, file, projectPath);
  const references: References = {
    cite: { order: [], data: {} },
  };
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  const state = new ReferenceState({ numbering: frontmatter.numbering, file: vfile });
  cache.$internalReferences[file] = state;
  // Import additional content from mdast or other files
  importMdastFromJson(session, file, mdast);
  includeFilesDirective(session, file, mdast);
  // This needs to come before basic transformations since it may add labels to blocks
  liftCodeMetadataToBlock(session, file, mdast);

  await unified()
    .use(basicTransformationsPlugin)
    .use(inlineExpressionsPlugin) // Happens before math and images!
    .use(htmlPlugin, { htmlHandlers })
    .use(mathPlugin, { macros: frontmatter.math })
    .use(glossaryPlugin, { state }) // This should be before the enumerate plugins
    .use(abbreviationPlugin, { abbreviations: frontmatter.abbreviations })
    .use(enumerateTargetsPlugin, { state }) // This should be after math
    .use(joinGatesPlugin)
    .run(mdast, vfile);

  // Run the link transformations that can be done without knowledge of other files
  const intersphinx = projectPath ? await loadIntersphinx(session, { projectPath }) : [];
  const transformers = [
    new WikiTransformer(),
    new GithubTransformer(),
    new RRIDTransformer(),
    new DOITransformer(), // This also is picked up in the next transform
    new MystTransformer(intersphinx),
  ];
  linksTransform(mdast, vfile, { transformers, selector: LINKS_SELECTOR });

  // Initialize citation renderers for this (non-bib) file
  cache.$citationRenderers[file] = await transformLinkedDOIs(log, mdast, cache.$doiRenderers, file);
  const rendererFiles = [file];
  if (projectPath) {
    rendererFiles.unshift(projectPath);
  } else {
    const localFiles = (await bibFilesInDir(session, path.dirname(file))) || [];
    rendererFiles.push(...localFiles);
  }
  // Combine file-specific citation renderers with project renderers from bib files
  const fileCitationRenderer = combineCitationRenderers(cache, ...rendererFiles);
  // Kind needs to still be Article here even if jupytext, to handle outputs correctly
  await transformOutputs(session, mdast, kind, imageWriteFolder, {
    altOutputFolder: imageAltOutputFolder,
    minifyMaxCharacters,
  });
  transformCitations(log, mdast, fileCitationRenderer, references, file);
  await unified()
    .use(codePlugin, { lang: frontmatter?.kernelspec?.language })
    .use(footnotesPlugin) // Needs to happen near the end
    .run(mdast, vfile);
  await transformImages(session, mdast, file, imageWriteFolder, {
    altOutputFolder: imageAltOutputFolder,
    imageExtensions,
  });
  // Must happen after transformImages
  await transformImageFormats(session, mdast, file, imageWriteFolder, {
    altOutputFolder: imageAltOutputFolder,
    imageExtensions,
  });
  // Note, the thumbnail transform must be **after** images, as it may read the images
  await transformThumbnail(session, mdast, file, frontmatter, imageWriteFolder, {
    altOutputFolder: imageAltOutputFolder,
  });
  const sha256 = selectors.selectFileInfo(store.getState(), file).sha256 as string;
  const useSlug = pageSlug !== index;
  const url = projectSlug
    ? `/${projectSlug}/${useSlug ? pageSlug : ''}`
    : `/${useSlug ? pageSlug : ''}`;
  const dataUrl = projectSlug ? `/${projectSlug}/${pageSlug}.json` : `/${pageSlug}.json`;
  store.dispatch(
    watch.actions.updateFileInfo({
      path: file,
      title: frontmatter.title,
      short_title: frontmatter.short_title,
      description: frontmatter.description,
      date: frontmatter.date,
      thumbnail: frontmatter.thumbnail,
      thumbnailOptimized: frontmatter.thumbnailOptimized,
      tags: frontmatter.tags,
      url,
      dataUrl,
    }),
  );
  const data: RendererData = {
    kind: frontmatter.kernelspec || frontmatter.jupytext ? SourceFileKind.Notebook : kind,
    file,
    sha256,
    slug: pageSlug,
    dependencies: [],
    frontmatter,
    mdast,
    references,
  };
  cache.$mdast[file].post = data;
  if (extraTransforms) {
    await Promise.all(
      extraTransforms.map(async (transform) => {
        await transform(session, opts);
      }),
    );
  }
  logMessagesFromVFile(session, vfile);
  if (!watchMode) log.info(toc(`📖 Built ${file} in %s.`));
}

export async function postProcessMdast(
  session: ISession,
  {
    file,
    checkLinks,
    pageReferenceStates,
    extraLinkTransformers,
  }: {
    file: string;
    checkLinks?: boolean;
    pageReferenceStates?: PageReferenceStates;
    extraLinkTransformers?: LinkTransformer[];
  },
) {
  const toc = tic();
  const { log } = session;
  const cache = castSession(session);
  const mdastPost = selectFile(session, file);
  if (!mdastPost) return;
  const fileState = cache.$internalReferences[file];
  const state = pageReferenceStates
    ? new MultiPageReferenceState(pageReferenceStates, file)
    : fileState;
  // NOTE: This is doing things in place, we should potentially make this a different state?
  const transformers = [
    ...(extraLinkTransformers || []),
    new StaticFileTransformer(session, file), // Links static files and internally linked files
  ];
  linksTransform(mdastPost.mdast, state.file as VFile, {
    transformers,
    selector: LINKS_SELECTOR,
  });
  resolveReferencesTransform(mdastPost.mdast, state.file as VFile, { state });
  embedDirective(session, mdastPost.mdast, mdastPost.dependencies, state);
  // Ensure there are keys on every node after post processing
  keysTransform(mdastPost.mdast);
  logMessagesFromVFile(session, fileState.file);
  log.debug(toc(`Transformed mdast cross references and links for "${file}" in %s`));
  if (checkLinks) await checkLinksTransform(session, file, mdastPost.mdast);
}
