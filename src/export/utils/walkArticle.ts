import fetch from 'node-fetch';
import {
  VersionId,
  KINDS,
  oxaLinkToId,
  oxaLink,
  Blocks,
  FigureStyles,
  OutputSummaryKind,
  ReferenceFormatTypes,
} from '@curvenote/blocks';
import { DEFAULT_IMAGE_WIDTH, nodeNames, Nodes, ReferenceKind } from '@curvenote/schema';
import { encode } from 'html-entities';
import Bottleneck from 'bottleneck';
import { getEditorState, getEditorStateFromHTML } from '../../actions/utils';
import { Block, Version } from '../../models';
import { getLatestVersion } from '../../actions/getLatest';
import { getImageSrc } from './getImageSrc';
import { basekey } from './basekey';
import { ISession } from '../../session/types';

export interface ArticleStateChild {
  state?: ReturnType<typeof getEditorState>;
  version?: Version;
  templateTags?: string[];
}

export interface ArticleStateReference {
  label: string;
  bibtex: string;
  version: Version<Blocks.Reference>;
  state?: ReturnType<typeof getEditorState>;
}

export type ArticleState = {
  children: ArticleStateChild[];
  images: Record<string, Version<Blocks.Image | Blocks.Output>>;
  references: Record<string, ArticleStateReference>;
  tagged: Record<string, ArticleStateChild[]>;
};

function getCodeHTML(content: string, language: string, linenumbers: boolean) {
  return `<pre language="${language}"${linenumbers ? ' linenumbers=""' : ''}><code>${encode(
    content,
  )}</code></pre>`;
}

function getFigureHTML(
  id: string,
  src: string,
  title: string,
  caption: string,
  style: FigureStyles,
) {
  const { width = DEFAULT_IMAGE_WIDTH, align = 'center', numbered = false } = style;
  return `<figure id="${id}"${numbered ? ' numbered=""' : ''} align="${align}">
  <img src="${src}" align="${align}" alt="${title}" width="${width}%">
  <figcaption kind="fig">${caption}</figcaption>
</figure>`;
}

async function getEditorStateFromFirstHTMLOutput(version: Version<Blocks.Output>) {
  // find first
  const htmlOutput = version.data.outputs.find(
    (output) => output.kind === OutputSummaryKind.html && Boolean(output.content),
  );
  if (!htmlOutput) return null;
  let { content } = htmlOutput;
  if (htmlOutput.link) {
    const response = await fetch(htmlOutput.link);
    if (!response.ok) return null;
    content = await response.text();
  }
  return content ? getEditorStateFromHTML(content) : null;
}

export function outputHasHtml(version: Version<Blocks.Output>) {
  return version.data.outputs.reduce((found, { kind, content }) => {
    return found || (kind === OutputSummaryKind.html && Boolean(content));
  }, false);
}

export function outputHasImage(version: Version<Blocks.Output>) {
  return version.data.outputs.reduce((found, { kind }) => {
    return found || kind === OutputSummaryKind.image;
  }, false);
}

export async function walkArticle(
  session: ISession,
  data: Blocks.Article,
  templateTags: string[] = [],
  referenceFormat: ReferenceFormatTypes = ReferenceFormatTypes.bibtex,
): Promise<ArticleState> {
  session.log.debug('Starting walkArticle...');
  const images: ArticleState['images'] = {};
  const referenceKeys: Set<string> = new Set();
  const references: ArticleState['references'] = {};

  const limiter = new Bottleneck({ maxConcurrent: 25 });

  const templateTagSet = new Set(templateTags); // ensure dedupe
  const children: ArticleState['children'] = await Promise.all(
    data.order.map(async (k) => {
      const articleChild = data.children[k];
      const srcId = articleChild?.src;
      const style = articleChild?.style ?? {};
      if (!srcId) return {};

      const childBlock = await limiter.schedule(() => new Block(session, srcId).get());
      const childVersion = await limiter.schedule(() => new Version(session, srcId).get());

      // Do not walk the content if it shouldn't be walked
      if (new Set(childBlock.data.tags).has('no-export')) return {};

      switch (childVersion.data.kind) {
        case KINDS.Content: {
          const state = getEditorState(childVersion.data.content);
          const matchingTags = childBlock.data.tags.filter((t) => templateTagSet.has(t));
          return {
            state,
            version: childVersion,
            templateTags: matchingTags.length > 0 ? matchingTags : undefined,
          };
        }
        case KINDS.Code: {
          const version = childVersion as Version<Blocks.Code>;
          const html = getCodeHTML(version.data.content, version.data.language, false);
          const state = getEditorState(html);
          return {
            state,
            version: childVersion,
          };
        }
        case KINDS.Image: {
          const key = oxaLink('', childVersion.id);
          const version = childVersion as Version<Blocks.Image>;
          if (!key) return {};
          const html = getFigureHTML(
            articleChild.src.block,
            key,
            childVersion.data.title,
            // Note: the caption is on the block!
            childBlock.data.caption ?? '',
            style,
          );
          const state = getEditorState(html);
          images[key] = version;
          return { state, version };
        }
        case KINDS.Output: {
          const key = oxaLink('', childVersion.id);
          const version = childVersion as Version<Blocks.Output>;
          if (!key) return {};
          if (outputHasImage(version as Version<Blocks.Output>)) {
            const html = getFigureHTML(
              articleChild.id,
              key,
              childVersion.data.title,
              // Note: the caption is on the block!
              childBlock.data.caption ?? '',
              style,
            );
            const state = getEditorState(html);
            images[key] = version;
            return { state, version };
          }
          if (outputHasHtml(version)) {
            const state = await getEditorStateFromFirstHTMLOutput(version);
            if (state == null) return {};
            return { state, version };
          }
          return {};
        }
        default:
          return {};
      }
    }),
  );

  // Load all images and references
  Object.entries(children).forEach(([, { state }]) => {
    if (!state) return;
    state.doc.descendants((node) => {
      switch (node.type.name) {
        case nodeNames.image: {
          const { src } = node.attrs as Nodes.Image.Attrs;
          const id = oxaLinkToId(src)?.block as VersionId;
          if (id) images[src] = new Version(session, id);
          return true;
        }
        case nodeNames.cite: {
          const { key, kind } = node.attrs as Nodes.Cite.Attrs;
          switch (kind) {
            case ReferenceKind.cite:
              if (key) referenceKeys.add(key);
              return true;
            case ReferenceKind.table:
            case ReferenceKind.eq:
            case ReferenceKind.sec:
            case ReferenceKind.code:
            case ReferenceKind.fig:
              // TODO: add a lookup table for reference IDs
              return true;
            default:
              return true;
          }
        }
        default:
          return true;
      }
    });
  });

  // Load all of the references
  session.log.debug('Starting Reference Localizaton...');
  await Promise.all(
    [...referenceKeys].map(async (key) => {
      const id = oxaLinkToId(key)?.block as VersionId;
      if (!id) return;
      // Always load the latest version for references!
      let version;
      try {
        const blockAndVersion = await limiter.schedule(() =>
          getLatestVersion<Blocks.Reference>(session, id, {
            format: referenceFormat,
          }),
        );
        version = blockAndVersion.version;
      } catch (err) {
        session.log.error(`Could not fetch latest version of reference - skipping ${key}`);
        return;
      }
      if (version.data.kind !== KINDS.Reference) return;
      const { content } = version.data;
      // Extract the label: '@article{SimPEG2015,\n...' ➡️ 'SimPEG2015'
      const label = content.slice(content.indexOf('{') + 1, content.indexOf(','));

      const existing = references[basekey(key)];
      const state =
        referenceFormat === ReferenceFormatTypes.html ? getEditorState(content) : undefined;
      if (existing) {
        const ve = existing.version.id.version;
        const v = version.id.version;
        // if existing, only update if incoming version is defined and greater than the existing
        if (ve == null || ve < (v ?? 0)) {
          references[basekey(key)] = {
            label,
            bibtex: content,
            version,
            state,
          };
        }
      } else {
        references[basekey(key)] = {
          label,
          bibtex: content,
          version,
          state,
        };
      }
    }),
  );

  const contentChildren = children.filter((c) => !c.templateTags);
  const taggedChildren = children.filter((c) => c.templateTags);

  const tagged = Array.from(templateTagSet).reduce<Record<string, ArticleStateChild[]>>(
    (obj, tag) => {
      return { ...obj, [tag]: taggedChildren.filter((c) => c.templateTags?.indexOf(tag) !== -1) };
    },
    {},
  );

  return {
    children: contentChildren,
    images,
    references,
    tagged,
  };
}

export async function loadImagesToBuffers(images: ArticleState['images']) {
  const buffers: Record<string, Buffer> = {};
  await Promise.all(
    Object.entries(images).map(async ([key, version]) => {
      await version.get();
      const { src } = getImageSrc(version);
      if (!src) return;
      const response = await fetch(src);
      // TODO convert SVGs to PNG` with imagemagick
      const buffer = await response.buffer();
      buffers[key] = buffer;
    }),
  );
  return buffers;
}
