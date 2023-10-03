import path from 'node:path';
import { tic } from 'myst-cli-utils';
import type { GenericParent, References } from 'myst-common';
import { fileError, fileWarn, RuleId } from 'myst-common';
import { SourceFileKind } from 'myst-spec-ext';
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
  embedTransform,
  importMdastFromJson,
  includeFilesTransform,
  liftCodeMetadataToBlock,
  transformLinkedDOIs,
  transformOutputs,
  transformCitations,
  transformImages,
  transformImageFormats,
  transformThumbnail,
  StaticFileTransformer,
  inlineExpressionsPlugin,
  propagateBlockDataToCode,
  transformBanner,
  reduceOutputs,
  transformPlaceholderImages,
  transformDeleteBase64UrlSource,
  transformWebp,
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
    // TODO: Remove once this is landed in myst-parser
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
    useExistingImages?: boolean;
    imageAltOutputFolder?: string;
    imageExtensions?: ImageExtensions[];
    watchMode?: boolean;
    extraTransforms?: TransformFn[];
    minifyMaxCharacters?: number;
    index?: string;
    simplifyFigures?: boolean;
    processThumbnail?: boolean;
  },
) {
  const {
    file,
    imageWriteFolder,
    projectPath,
    pageSlug,
    projectSlug,
    useExistingImages,
    imageAltOutputFolder,
    imageExtensions,
    extraTransforms,
    watchMode = false,
    minifyMaxCharacters,
    index,
    simplifyFigures,
    processThumbnail,
  } = opts;
  const toc = tic();
  const { store, log } = session;
  const cache = castSession(session);
  if (!cache.$mdast[file]) return;
  const { mdast: mdastPre, kind, frontmatter: preFrontmatter, location } = cache.$mdast[file].pre;
  if (!mdastPre) throw new Error(`Expected mdast to be parsed for ${file}`);
  log.debug(`Processing "${file}"`);
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  // Use structuredClone in future (available in node 17)
  const mdast = JSON.parse(JSON.stringify(mdastPre)) as GenericParent;
  const frontmatter = preFrontmatter
    ? processPageFrontmatter(
        session,
        preFrontmatter,
        {
          property: 'frontmatter',
          file,
          messages: {},
          errorLogFn: (message: string) => {
            fileError(vfile, message, { ruleId: RuleId.validPageFrontmatter });
          },
          warningLogFn: (message: string) => {
            fileWarn(vfile, message, { ruleId: RuleId.validPageFrontmatter });
          },
        },
        projectPath,
      )
    : getPageFrontmatter(session, mdast, file, projectPath);
  const references: References = {
    cite: { order: [], data: {} },
  };
  const state = new ReferenceState({ numbering: frontmatter.numbering, file: vfile });
  cache.$internalReferences[file] = state;
  // Import additional content from mdast or other files
  importMdastFromJson(session, file, mdast);
  includeFilesTransform(session, file, mdast, vfile);
  // This needs to come before basic transformations since it may add labels to blocks
  liftCodeMetadataToBlock(session, vfile, mdast);

  await unified()
    .use(basicTransformationsPlugin)
    .use(inlineExpressionsPlugin) // Happens before math and images!
    .use(htmlPlugin, { htmlHandlers })
    .use(mathPlugin, { macros: frontmatter.math })
    .use(glossaryPlugin, { state }) // This should be before the enumerate plugins
    .use(abbreviationPlugin, { abbreviations: frontmatter.abbreviations, firstTimeLong: frontmatter.firstTimeLong })
    .use(enumerateTargetsPlugin, { state }) // This should be after math
    .use(joinGatesPlugin)
    .run(mdast, vfile);

  // This needs to come after basic transformations since meta tags are added there
  propagateBlockDataToCode(session, vfile, mdast);

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
  cache.$citationRenderers[file] = await transformLinkedDOIs(
    log,
    vfile,
    mdast,
    cache.$doiRenderers,
    file,
  );
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
    altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
    minifyMaxCharacters,
    vfile,
  });
  transformCitations(mdast, fileCitationRenderer, references);
  await unified()
    .use(codePlugin, { lang: frontmatter?.kernelspec?.language })
    .use(footnotesPlugin) // Needs to happen near the end
    .run(mdast, vfile);
  if (simplifyFigures) {
    // Transform output nodes to images / text
    reduceOutputs(mdast, file, imageWriteFolder);
  }
  if (!useExistingImages) {
    await transformImages(session, mdast, file, imageWriteFolder, {
      altOutputFolder: imageAltOutputFolder,
      imageExtensions,
    });
    // Must happen after transformImages
    await transformImageFormats(session, mdast, file, imageWriteFolder, {
      altOutputFolder: imageAltOutputFolder,
      imageExtensions,
    });
    if (processThumbnail) {
      // Note, the thumbnail transform must be **after** images, as it may read the images
      await transformThumbnail(session, mdast, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: extraTransforms?.includes(transformWebp),
      });
      await transformBanner(session, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: extraTransforms?.includes(transformWebp),
      });
    }
  }
  await transformDeleteBase64UrlSource(mdast);
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
      banner: frontmatter.banner,
      bannerOptimized: frontmatter.bannerOptimized,
      tags: frontmatter.tags,
      url,
      dataUrl,
    }),
  );
  const data: RendererData = {
    kind: frontmatter.kernelspec || frontmatter.jupytext ? SourceFileKind.Notebook : kind,
    file,
    location,
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
    simplifyFigures,
    imageExtensions,
  }: {
    file: string;
    checkLinks?: boolean;
    pageReferenceStates?: PageReferenceStates;
    extraLinkTransformers?: LinkTransformer[];
    simplifyFigures?: boolean;
    imageExtensions?: ImageExtensions[];
  },
) {
  const toc = tic();
  const { log } = session;
  const cache = castSession(session);
  const mdastPost = selectFile(session, file);
  if (!mdastPost) return;
  const { mdast, dependencies } = mdastPost;
  const fileState = cache.$internalReferences[file];
  const state = pageReferenceStates
    ? new MultiPageReferenceState(pageReferenceStates, file)
    : fileState;
  // NOTE: This is doing things in place, we should potentially make this a different state?
  const transformers = [
    ...(extraLinkTransformers || []),
    new StaticFileTransformer(session, file), // Links static files and internally linked files
  ];
  linksTransform(mdast, state.file as VFile, {
    transformers,
    selector: LINKS_SELECTOR,
  });
  resolveReferencesTransform(mdast, state.file as VFile, { state });
  embedTransform(session, mdast, dependencies, state);
  if (simplifyFigures) {
    // This must happen after embedded content is resolved so all children are present on figures
    transformPlaceholderImages(mdast, { imageExtensions });
  }
  // Ensure there are keys on every node after post processing
  keysTransform(mdast);
  logMessagesFromVFile(session, fileState.file);
  log.debug(toc(`Transformed mdast cross references and links for "${file}" in %s`));
  if (checkLinks) await checkLinksTransform(session, file, mdastPost.mdast);
}
