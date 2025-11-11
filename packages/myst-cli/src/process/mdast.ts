import path from 'node:path';
import { tic } from 'myst-cli-utils';
import type { GenericParent, IExpressionResult, PluginUtils, References } from 'myst-common';
import { fileError, fileWarn, RuleId, slugToUrl } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { SourceFileKind } from 'myst-spec-ext';
import type { LinkTransformer, ReferenceState } from 'myst-transforms';
import {
  htmlTransform,
  footnotesTransform,
  MultiPageReferenceResolver,
  resolveLinksAndCitationsTransform,
  resolveReferencesTransform,
  mathTransform,
  codeTransform,
  keysTransform,
  linksTransform,
  MystTransformer,
  SphinxTransformer,
  WikiTransformer,
  GithubTransformer,
  RRIDTransformer,
  RORTransformer,
  DOITransformer,
  glossaryTransform,
  abbreviationTransform,
  reconstructHtmlTransform,
  inlineMathSimplificationTransform,
  checkLinkTextTransform,
  indexIdentifierTransform,
  buildTocTransform,
  basicTransformations,
} from 'myst-transforms';
import { unified } from 'unified';
import { select, selectAll } from 'unist-util-select';
import { VFile } from 'vfile';
import { processPageFrontmatter, updateFileInfoFromFrontmatter } from '../frontmatter.js';
import { selectors } from '../store/index.js';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/cache.js';
import type { RendererData } from '../transforms/types.js';

import {
  checkLinksTransform,
  embedTransform,
  importMdastFromJson,
  includeFilesTransform,
  liftCodeMetadataToBlock,
  transformCitations,
  transformImageFormats,
  transformLinkedDOIs,
  transformLinkedRORs,
  transformOutputsToCache,
  transformRenderInlineExpressions,
  transformThumbnail,
  StaticFileTransformer,
  propagateBlockDataToCode,
  transformBanner,
  reduceOutputs,
  transformPlaceholderImages,
  transformDeleteBase64UrlSource,
  transformWebp,
  transformOutputsToFile,
  transformImagesToEmbed,
  transformImagesWithoutExt,
  transformImagesToDisk,
  transformFilterOutputStreams,
  transformLiftCodeBlocksInJupytext,
  transformMystXRefs,
} from '../transforms/index.js';
import type { ImageExtensions } from '../utils/resolveExtension.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { combineCitationRenderers } from './citations.js';
import { bibFilesInDir, selectFile } from './file.js';
import { parseMyst } from './myst.js';
import { kernelExecutionTransform, LocalDiskCache } from 'myst-execute';
import type { IOutput } from '@jupyterlab/nbformat';
import { rawDirectiveTransform } from '../transforms/raw.js';
import { addEditUrl } from '../utils/addEditUrl.js';
import {
  indexFrontmatterFromProject,
  manifestPagesFromProject,
  manifestTitleFromProject,
} from '../build/utils/projectManifest.js';
import { TransformPipelineBuilder } from './pipeline.js';

const LINKS_SELECTOR = 'link,card,linkBlock';

const pluginUtils: PluginUtils = { select, selectAll };

const htmlHandlers = {
  comment(h: any, node: any) {
    // Prevents HTML comments from showing up as text in web
    // TODO: Remove once this is landed in myst-parser
    const result = h(node, 'comment');
    (result as any).value = node.value;
    return result;
  },
};

export type TransformFn = (
  session: ISession,
  opts: Parameters<typeof transformMdast>[1],
) => Promise<void>;

export async function transformMdast(
  session: ISession,
  opts: {
    file: string;
    projectPath?: string;
    projectSlug?: string;
    pageSlug?: string;
    imageExtensions?: ImageExtensions[];
    watchMode?: boolean;
    execute?: boolean;
    extraTransforms?: TransformFn[];
    minifyMaxCharacters?: number;
    index?: string;
    titleDepth?: number;
    offset?: number;
  },
) {
  const {
    file,
    projectPath,
    pageSlug,
    projectSlug,
    imageExtensions,
    extraTransforms,
    watchMode = false,
    minifyMaxCharacters,
    index,
    titleDepth, // Related to title set in markdown, rather than frontmatter
    offset, // Related to multi-page nesting
    execute,
  } = opts;
  const toc = tic();
  const { store, log } = session;
  const cache = castSession(session);
  if (!cache.$getMdast(file)) return;
  const {
    mdast: mdastPre,
    kind,
    frontmatter: preFrontmatter,
    location,
    identifiers,
    widgets,
  } = cache.$getMdast(file)?.pre ?? {};
  if (!mdastPre || !kind || !location) throw new Error(`Expected mdast to be parsed for ${file}`);
  log.debug(`Processing "${file}"`);
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  const mdast = structuredClone(mdastPre);
  const frontmatter = processPageFrontmatter(
    session,
    preFrontmatter ?? {},
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
  );
  if (offset) {
    if (!frontmatter.numbering) frontmatter.numbering = {};
    if (!frontmatter.numbering.title) frontmatter.numbering.title = {};
    if (frontmatter.numbering.title.offset == null) frontmatter.numbering.title.offset = offset;
  }
  const isJupytext = frontmatter.kernelspec || frontmatter.jupytext;
  await addEditUrl(session, frontmatter, file);
  const references: References = {
    cite: { order: [], data: {} },
  };
  const builder = new TransformPipelineBuilder();

  // Import additional content from mdast or other files
  builder.addTransform('import-mdast-json', (tree) => importMdastFromJson(session, file, tree));

  builder.addTransform('include-files', (tree) =>
    includeFilesTransform(session, file, tree, frontmatter, vfile),
  );

  builder.addTransform('raw-directive', (tree) => rawDirectiveTransform(tree, vfile));

  // This needs to come before basic transformations since it may add labels to blocks
  builder.addTransform('lift-code-metadata', (tree) =>
    liftCodeMetadataToBlock(session, vfile, tree),
  );

  const executionCachePath = path.join(session.buildPath(), 'execute');
  builder.addTransform(
    'kernel-execution',
    (tree) =>
      kernelExecutionTransform(tree, vfile, {
        basePath: session.sourcePath(),
        cache: new LocalDiskCache<(IExpressionResult | IOutput[])[]>(executionCachePath),
        sessionFactory: () => session.jupyterSessionManager(),
        frontmatter: frontmatter,
        ignoreCache: false,
        errorIsFatal: false,
        log: session.log,
      }),
    {
      skip: !(execute && !frontmatter.execute?.skip),
    },
  );

  builder.addTransform('reconstruct-html', reconstructHtmlTransform);
  builder.addTransform('html', (tree) => htmlTransform(tree, { htmlHandlers }));
  builder.addTransform('basic-transformations', (tree) =>
    basicTransformations(tree, vfile, {
      parser: (content: string) => parseMyst(session, content, file),
      firstDepth: (titleDepth ?? 1) + (frontmatter.content_includes_title ? 0 : 1),
    }),
  );
  builder.addTransform('inline-math-simplification', (tree) =>
    inlineMathSimplificationTransform(tree, { replaceSymbol: false }),
  );
  builder.addTransform('math', (tree) => mathTransform(tree, vfile, { macros: frontmatter.math }));
  // Load custom transform plugins
  session.plugins?.transforms.forEach((t) => {
    builder.addTransform(
      t.name,
      async (tree) => {
        // TODO: drop unified shim
        await unified().use(t.plugin, undefined, pluginUtils).run(tree, vfile);
      },
      { after: t.after, before: t.before },
    );
  });

  builder.addTransform('glossary', (tree) => glossaryTransform(tree, vfile));
  builder.addTransform('abbreviation', (tree) =>
    abbreviationTransform(tree, { abbreviations: frontmatter.abbreviations }),
  );
  builder.addTransform('index-identifier', indexIdentifierTransform);

  // This needs to come after basic transformations since meta tags are added there
  builder.addTransform('propogate-block-data-to-code', (tree) =>
    propagateBlockDataToCode(session, vfile, tree),
  );

  const registerCitationsContext: { state?: ReturnType<typeof combineCitationRenderers> } = {};
  const registerCitations = async (tree: typeof mdast) => {
    // Initialize citation renderers for this (non-bib) file
    cache.$citationRenderers[file] = await transformLinkedDOIs(
      session,
      vfile,
      tree,
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
    registerCitationsContext.state = combineCitationRenderers(cache, ...rendererFiles);
  };
  builder.addTransform('register-citations', registerCitations);

  builder.addTransform('render-inline-expresssions', (tree) =>
    transformRenderInlineExpressions(tree, vfile),
  );

  builder.addTransform(
    'outputs-to-cache',
    async (tree) => await transformOutputsToCache(session, tree, kind, { minifyMaxCharacters }),
  );

  builder.addTransform('filter-output-streams', (tree) =>
    transformFilterOutputStreams(tree, vfile, frontmatter.settings),
  );

  builder.addTransform('citations', (tree) =>
    transformCitations(session, file, tree, registerCitationsContext.state!, references),
  );

  builder.addTransform('code', (tree) =>
    codeTransform(tree, vfile, { lang: frontmatter?.kernelspec?.language }),
  );

  builder.addTransform('footnotes', (tree) => footnotesTransform(tree, vfile));

  builder.addTransform('images-to-embed', transformImagesToEmbed);

  builder.addTransform('images-without-ext', (tree) =>
    transformImagesWithoutExt(session, tree, file, { imageExtensions }),
  );

  builder.addTransform('lift-code-blocks-in-jupytext', transformLiftCodeBlocksInJupytext, {
    skip: !isJupytext,
  });

  const sha256 = selectors.selectFileInfo(store.getState(), file).sha256 as string;
  const writePostMdast = async () => {
    const useSlug = pageSlug !== index;
    let url: string | undefined;
    let dataUrl: string | undefined;
    if (pageSlug && projectSlug) {
      url = `/${projectSlug}/${useSlug ? pageSlug : ''}`;
      dataUrl = `/${projectSlug}/${pageSlug}.json`;
    } else if (pageSlug) {
      url = `/${useSlug ? pageSlug : ''}`;
      dataUrl = `/${pageSlug}.json`;
    }
    url = slugToUrl(url);

    updateFileInfoFromFrontmatter(session, file, frontmatter, url, dataUrl);

    const data: RendererData = {
      kind: isJupytext ? SourceFileKind.Notebook : kind,
      file,
      location,
      sha256,
      slug: pageSlug,
      dependencies: [],
      frontmatter,
      mdast,
      references,
      identifiers,
      widgets,
    } as any;
    const cachedMdast = cache.$getMdast(file);
    if (cachedMdast) cachedMdast.post = data;
    if (extraTransforms) {
      await Promise.all(
        extraTransforms.map(async (transform) => {
          await transform(session, opts);
        }),
      );
    }
  };
  builder.addTransform('write-post-mdast', writePostMdast);

  await builder.build().run(mdast);

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
    site,
  }: {
    file: string;
    checkLinks?: boolean;
    pageReferenceStates: ReferenceState[];
    extraLinkTransformers?: LinkTransformer[];
    site?: boolean;
  },
) {
  const toc = tic();
  const { log } = session;
  const cache = castSession(session);
  const mdastPost = selectFile(session, file);
  if (!mdastPost) return;
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  const { mdast, dependencies, frontmatter } = mdastPost;
  const state = new MultiPageReferenceResolver(pageReferenceStates, file, vfile);
  const externalReferences = Object.values(cache.$externalReferences);
  const storeState = session.store.getState();
  const projectPath = selectors.selectCurrentProjectPath(storeState);
  const siteConfig = selectors.selectCurrentSiteConfig(storeState);
  const projectSlug = siteConfig?.projects?.find((proj) => proj.path === projectPath)?.slug;
  const builder = new TransformPipelineBuilder();

  builder.addTransform(
    'build-toc',
    async (tree) =>
      buildTocTransform(
        tree,
        vfile,
        projectPath
          ? [
              {
                title: manifestTitleFromProject(session, projectPath),
                level: 1,
                slug: '',
                enumerator: indexFrontmatterFromProject(session, projectPath).enumerator,
              },
              ...(await manifestPagesFromProject(session, projectPath)),
            ]
          : undefined,
        projectSlug,
      ),
    { skip: !site },
  );
  // NOTE: This is doing things in place, we should potentially make this a different state?
  const transformers = [
    ...(extraLinkTransformers || []),
    new WikiTransformer(),
    new GithubTransformer(),
    new RRIDTransformer(),
    new RORTransformer(),
    new DOITransformer(), // This also is picked up in the next transform
    new MystTransformer(externalReferences),
    new SphinxTransformer(externalReferences),
    new StaticFileTransformer(session, file), // Links static files and internally linked files
  ];

  builder.addTransform('resolve-links-and-citations', (tree) =>
    resolveLinksAndCitationsTransform(tree, { state, transformers }),
  );

  builder.addTransform('links', (tree) =>
    linksTransform(tree, vfile, { transformers, selector: LINKS_SELECTOR }),
  );

  builder.addTransform(
    'linked-rors',
    async (tree) => await transformLinkedRORs(session, vfile, tree, file),
  );

  builder.addTransform('resolve-references', (tree) =>
    resolveReferencesTransform(tree, vfile, { state, transformers }),
  );

  builder.addTransform(
    'resolve-xrefs',
    async (tree) => await transformMystXRefs(session, vfile, tree, frontmatter),
  );

  builder.addTransform(
    'embed',
    async (tree) => await embedTransform(session, tree, file, dependencies, state),
  );

  session.plugins?.transforms.forEach((t) => {
    builder.addTransform(
      t.name,
      async (tree) => {
        await unified().use(t.plugin, undefined, pluginUtils).run(tree, vfile);
      },
      { after: t.after, before: t.before },
    );
  });

  // Ensure there are keys on every node after post processing
  builder.addTransform('keys', keysTransform);

  builder.addTransform('check-link-text', (tree) =>
    checkLinkTextTransform(tree, externalReferences, vfile),
  );

  log.debug(toc(`Transformed mdast cross references and links for "${file}" in %s`));

  builder.addTransform(
    'check-links',
    async (tree) => await checkLinksTransform(session, file, tree),
  );

  builder.build().run(mdast);
  logMessagesFromVFile(session, vfile);
}

export async function finalizeMdast(
  session: ISession,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
  file: string,
  {
    imageWriteFolder,
    useExistingImages,
    imageAltOutputFolder,
    imageExtensions,
    optimizeWebp,
    simplifyFigures,
    processThumbnail,
    maxSizeWebp,
  }: {
    imageWriteFolder: string;
    useExistingImages?: boolean;
    imageAltOutputFolder?: string;
    imageExtensions?: ImageExtensions[];
    optimizeWebp?: boolean;
    simplifyFigures?: boolean;
    processThumbnail?: boolean;
    maxSizeWebp?: number;
  },
) {
  const builder = new TransformPipelineBuilder();

  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;

  builder.addTransform(
    'reduce-outputs',
    (tree) => {
      reduceOutputs(session, tree, file, imageWriteFolder, {
        altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
      });
    },
    { skip: !simplifyFigures },
  );

  // Transform output nodes to images / text
  builder.addTransform('write-outputs', (tree) =>
    transformOutputsToFile(session, tree, imageWriteFolder, {
      altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
      vfile,
    }),
  );

  builder.addTransform(
    'write-images',
    async (tree) =>
      await transformImagesToDisk(session, tree, file, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        imageExtensions,
      }),
    { skip: useExistingImages },
  );
  // Must happen after transformImages
  builder.addTransform(
    'image-formats',
    async (tree) =>
      await transformImageFormats(session, tree, file, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        imageExtensions,
      }),
    { skip: useExistingImages },
  );
  builder.addTransform(
    'convert-webp',
    async () => await transformWebp(session, { file, imageWriteFolder, maxSizeWebp }),
    { skip: !(!useExistingImages && optimizeWebp) },
  );
  // Note, the thumbnail transform must be **after** images, as it may read the images
  builder.addTransform(
    'extract-thumbnails',
    async (tree) =>
      await transformThumbnail(session, tree, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: optimizeWebp,
        maxSizeWebp,
      }),
    { skip: !(!useExistingImages && processThumbnail) },
  );
  builder.addTransform(
    'extract-banner',
    async () =>
      await transformBanner(session, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: optimizeWebp,
        maxSizeWebp,
      }),
    { skip: !(!useExistingImages && processThumbnail) },
  );
  builder.addTransform('delete-base64', transformDeleteBase64UrlSource);

  // This must happen after embedded content is resolved so all children are present on figures
  builder.addTransform(
    'placeholder-images',
    (tree) => transformPlaceholderImages(tree, { imageExtensions }),
    { skip: !simplifyFigures },
  );

  await builder.build().run(mdast);

  const cache = castSession(session);
  const postData = cache.$getMdast(file)?.post;
  if (postData) {
    postData.frontmatter = frontmatter;
    postData.mdast = mdast;
    // TODO out-of-band widgets?
    postData.widgets = cache.$getMdast(file)?.pre.widgets;
    updateFileInfoFromFrontmatter(session, file, frontmatter);
  }
  logMessagesFromVFile(session, vfile);
}
