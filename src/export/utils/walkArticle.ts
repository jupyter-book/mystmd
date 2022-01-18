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
import { getEditorState } from '../../actions/utils';
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

function outputHasImage(version: Version<Blocks.Output>) {
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
  const images: ArticleState['images'] = {};
  const referenceKeys: Set<string> = new Set();
  const references: ArticleState['references'] = {};

  const templateTagSet = new Set(templateTags); // ensure dedupe
  const children: ArticleState['children'] = await Promise.all(
    data.order.map(async (k) => {
      const articleChild = data.children[k];
      const srcId = articleChild?.src;
      const style = articleChild?.style ?? {};
      if (!srcId) return {};
      const childBlock = await new Block(session, srcId).get();
      const childVersion = await new Version(session, srcId).get();

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
        case KINDS.Output:
        case KINDS.Image: {
          const key = oxaLink('', childVersion.id);
          const version = childVersion as Version<Blocks.Image | Blocks.Output>;
          if (!key) return {};
          if (version.data.kind === KINDS.Output) {
            if (!outputHasImage(version as Version<Blocks.Output>)) return {};
          }
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
  await Promise.all(
    [...referenceKeys].map(async (key) => {
      const id = oxaLinkToId(key)?.block as VersionId;
      if (!id) return;
      // Always load the latest version for references!
      const { version } = await getLatestVersion<Blocks.Reference>(session, id, {
        format: referenceFormat,
      });
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
      const buffer = await response.buffer();
      buffers[key] = buffer;
    }),
  );
  return buffers;
}
