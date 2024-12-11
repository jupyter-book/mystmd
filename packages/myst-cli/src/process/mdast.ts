import path from 'node:path';
import { tic } from 'myst-cli-utils';
import type { GenericParent, IExpressionResult, PluginUtils, References } from 'myst-common';
import { fileError, fileWarn, RuleId, slugToUrl } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { SourceFileKind } from 'myst-spec-ext';
import type { LinkTransformer } from 'myst-transforms';
import {
  ReferenceState,
  MultiPageReferenceResolver,
  resolveLinksAndCitationsTransform,
  resolveReferencesTransform,
  keysTransform,
  linksTransform,
  MystTransformer,
  SphinxTransformer,
  WikiTransformer,
  GithubTransformer,
  RRIDTransformer,
  RORTransformer,
  DOITransformer,
  checkLinkTextTransform,
  reconstructHtmlTransform,
  htmlTransform,
  basicTransformations,
  inlineMathSimplificationTransform,
  mathTransform,
  glossaryTransform,
  abbreviationTransform,
  indexIdentifierTransform,
  enumerateTargetsTransform,
  joinGatesTransform,
  codeTransform,
  footnotesTransform,
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

function referenceFileFromPartFile(session: ISession, partFile: string) {
  const state = session.store.getState();
  const partDeps = selectors.selectDependentFiles(state, partFile);
  if (partDeps.length > 0) return partDeps[0];
  const file = selectors.selectFileFromPart(state, partFile);
  return file ?? partFile;
}

type TransformFunction = (mdast: GenericParent) => void;

type TransformSorting = {
  after?: string;
  before?: string;
};
type TransformObject = {
  name: string;
  transform: TransformFunction;
} & TransformSorting;

class TransformPipeline {
  transforms: TransformFunction[];
  constructor(transforms: TransformFunction[]) {
    this.transforms = transforms;
  }

  async run(mdast: GenericParent) {
    for (const transform of this.transforms) {
      await Promise.resolve(transform(mdast));
    }
  }
}

class TransformPipelineBuilder {
  transforms: TransformObject[];
  constructor() {
    this.transforms = [];
  }

  build() {
    const transformNames = new Set(this.transforms.map((transform) => transform.name));
    this.transforms.forEach((transform) => {
      // Prohibit transforms from defining multiple relationship constraints
      // This assumption avoids a class of insertion conflicts
      if (transform.before && transform.after) {
        throw new Error('Transform cannot both define before and after');
      }
      const comparison = transform.before ?? transform.after;
      if (!comparison) return;
      if (comparison === transform.name) {
        throw new Error('Transform cannot refer to itself in before or after');
      }

      if (!transformNames.has(comparison)) {
        throw new Error('Transform must refer to valid transform in before or after');
      }
    });
    const namedTransforms = new Map(
      this.transforms.map((transform) => [transform.name, transform]),
    );
    const transformOrder = this.transforms
      .filter((t) => !t.before && !t.after)
      .map(({ name }) => name);
    while (transformOrder.length !== namedTransforms.size) {
      this.transforms.forEach((t) => {
        // Have we handled this yet?
        if (transformOrder.includes(t.name)) return;
        // Otherwise, can we handle it?
        if (t.before && transformOrder.includes(t.before)) {
          transformOrder.splice(transformOrder.indexOf(t.before), 0, t.name);
        } else if (t.after && transformOrder.includes(t.after)) {
          transformOrder.splice(transformOrder.indexOf(t.after) + 1, 0, t.name);
        }
      });
    }
    console.log(namedTransforms);
    const transforms = transformOrder.map((name) => namedTransforms.get(name)!.transform);
    return new TransformPipeline(transforms);
  }

  addTransform(name: string, transform: TransformFunction, sorting?: TransformSorting) {
    this.transforms.push({
      name,
      transform,
      ...sorting,
    });
  }
}

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
    titleDepth,
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
  const references: References = {
    cite: { order: [], data: {} },
  };
  const refFile = kind === SourceFileKind.Part ? referenceFileFromPartFile(session, file) : file;
  const state = new ReferenceState(refFile, {
    numbering: frontmatter.numbering,
    identifiers,
    vfile,
  });
  cache.$internalReferences[file] = state;

  const builder = new TransformPipelineBuilder();
  // <START>
  // Import additional content from mdast or other files
  builder.addTransform('import-mdast-json', (tree) => importMdastFromJson(session, file, tree)); // after=START
  builder.addTransform('include-files', (tree) =>
    includeFilesTransform(session, file, tree, frontmatter, vfile),
  );
  builder.addTransform('raw-directive', (tree) => rawDirectiveTransform(tree, vfile));
  // This needs to come before basic transformations since it may add labels to blocks
  builder.addTransform('lift-code-metadata', (tree) =>
    liftCodeMetadataToBlock(session, vfile, tree),
  );

  builder.addTransform('reconstruct-html', reconstructHtmlTransform); // We need to group and link the HTML first
  builder.addTransform('html', (tree) => htmlTransform(tree, { htmlHandlers })); // Some of the HTML plugins need to operate on the transformed html, e.g. figure caption transforms
  builder.addTransform('basic', (tree) =>
    basicTransformations(tree, vfile, {
      parser: (content: string) => parseMyst(session, content, file),
      firstDepth: (titleDepth ?? 1) + (frontmatter.content_includes_title ? 0 : 1),
    }),
  );
  builder.addTransform('inline-math', (tree) => inlineMathSimplificationTransform(tree));
  builder.addTransform('math', (tree) => mathTransform(tree, vfile, { macros: frontmatter.math }));
  builder.addTransform('glossary', (tree) => glossaryTransform(tree, vfile)); // This should be before the enumerate plugins
  builder.addTransform('abbreviation', (tree) =>
    abbreviationTransform(tree, { abbreviations: frontmatter.abbreviations }),
  );
  builder.addTransform('index-identifier', (tree) => indexIdentifierTransform(tree));
  builder.addTransform('enumerate-targets', (tree) => enumerateTargetsTransform(tree, { state })); // This should be after math/container transforms
  builder.addTransform('join-gates', (tree) => joinGatesTransform(tree, vfile));
  // Load custom transform plugins
  const pipe = unified();
  session.plugins?.transforms.forEach((t) => {
    if (t.stage !== 'document') return;
    pipe.use(t.plugin, undefined, pluginUtils);
  });
  builder.addTransform('legacy-plugins', (tree) => pipe.run(tree, vfile));

  // This needs to come after basic transformations since meta tags are added there
  builder.addTransform('propagate-block-data', (tree) =>
    propagateBlockDataToCode(session, vfile, tree),
  );

  // Initialize citation renderers for this (non-bib) file
  const citationState: { fileRenderer?: ReturnType<typeof combineCitationRenderers> } = {};
  const registerCitations = async (tree: GenericParent) => {
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
    citationState.fileRenderer = combineCitationRenderers(cache, ...rendererFiles);
  };
  builder.addTransform('register-citations', registerCitations);
  builder.addTransform('kernel-execution', (tree) => {
    if (execute) {
      const cachePath = path.join(session.buildPath(), 'execute');
      kernelExecutionTransform(tree, vfile, {
        basePath: session.sourcePath(),
        cache: new LocalDiskCache<(IExpressionResult | IOutput[])[]>(cachePath),
        sessionFactory: () => session.jupyterSessionManager(),
        frontmatter: frontmatter,
        ignoreCache: false,
        errorIsFatal: false,
        log: session.log,
      });
    }
  });
  builder.addTransform('render-inline-expressions', (tree) =>
    transformRenderInlineExpressions(tree, vfile),
  );
  builder.addTransform('cache-outputs', (tree) =>
    transformOutputsToCache(session, tree, kind, { minifyMaxCharacters }),
  );
  builder.addTransform('filter-output', (tree) =>
    transformFilterOutputStreams(tree, vfile, frontmatter.settings),
  );
  builder.addTransform('citations', (tree) => {
    if (citationState.fileRenderer) {
      transformCitations(session, file, tree, citationState.fileRenderer, references);
    }
  });

  builder.addTransform('code', (tree) =>
    codeTransform(tree, vfile, { lang: frontmatter?.kernelspec?.language }),
  );
  builder.addTransform('footnotes', (tree) => footnotesTransform(tree, vfile)); // Needs to happen near the end
  builder.addTransform('images-to-embed', transformImagesToEmbed);
  builder.addTransform('image-extensions', (tree) =>
    transformImagesWithoutExt(session, tree, file, { imageExtensions }),
  );
  const isJupytext = frontmatter.kernelspec || frontmatter.jupytext;
  if (isJupytext) {
    builder.addTransform('jupytext-lift-code-blocks', transformLiftCodeBlocksInJupytext);
  }
  const pipeline = builder.build();
  pipeline.run(mdast);
  const sha256 = selectors.selectFileInfo(store.getState(), file).sha256 as string;
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
    pageReferenceStates?: ReferenceState[];
    extraLinkTransformers?: LinkTransformer[];
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
  const fileState = cache.$internalReferences[file];
  const state = pageReferenceStates
    ? new MultiPageReferenceResolver(pageReferenceStates, file, vfile)
    : fileState;
  const externalReferences = Object.values(cache.$externalReferences);
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
  resolveLinksAndCitationsTransform(mdast, { state, transformers });
  linksTransform(mdast, state.vfile as VFile, {
    transformers,
    selector: LINKS_SELECTOR,
  });
  await transformLinkedRORs(session, vfile, mdast, file);
  resolveReferencesTransform(mdast, state.vfile as VFile, { state, transformers });
  await transformMystXRefs(session, vfile, mdast, frontmatter);
  await embedTransform(session, mdast, file, dependencies, state);
  const pipe = unified();
  session.plugins?.transforms.forEach((t) => {
    if (t.stage !== 'project') return;
    pipe.use(t.plugin, undefined, pluginUtils);
  });
  await pipe.run(mdast, vfile);

  // Ensure there are keys on every node after post processing
  keysTransform(mdast);
  checkLinkTextTransform(mdast, externalReferences, vfile);
  logMessagesFromVFile(session, fileState.vfile);
  logMessagesFromVFile(session, vfile);
  log.debug(toc(`Transformed mdast cross references and links for "${file}" in %s`));
  if (checkLinks) await checkLinksTransform(session, file, mdast);
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
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  if (simplifyFigures) {
    // Transform output nodes to images / text
    reduceOutputs(session, mdast, file, imageWriteFolder, {
      altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
    });
  }
  transformOutputsToFile(session, mdast, imageWriteFolder, {
    altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
    vfile,
  });
  if (!useExistingImages) {
    await transformImagesToDisk(session, mdast, file, imageWriteFolder, {
      altOutputFolder: imageAltOutputFolder,
      imageExtensions,
    });
    // Must happen after transformImages
    await transformImageFormats(session, mdast, file, imageWriteFolder, {
      altOutputFolder: imageAltOutputFolder,
      imageExtensions,
    });
    if (optimizeWebp) {
      await transformWebp(session, { file, imageWriteFolder, maxSizeWebp });
    }
    if (processThumbnail) {
      // Note, the thumbnail transform must be **after** images, as it may read the images
      await transformThumbnail(session, mdast, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: optimizeWebp,
        maxSizeWebp,
      });
      await transformBanner(session, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: optimizeWebp,
        maxSizeWebp,
      });
    }
  }
  await transformDeleteBase64UrlSource(mdast);
  if (simplifyFigures) {
    // This must happen after embedded content is resolved so all children are present on figures
    transformPlaceholderImages(mdast, { imageExtensions });
  }
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
