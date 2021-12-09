import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { VersionId, KINDS, oxaLinkToId, oxaLink, Blocks } from '@curvenote/blocks';
import { nodeNames, Nodes } from '@curvenote/schema';
import { Session } from '../../session';
import { getEditorState } from '../../actions/utils';
import { Block, Version } from '../../models';

type ArticleState = {
  children: { state?: ReturnType<typeof getEditorState>; version?: Version }[];
  images: Record<string, Version<Blocks.Image>>;
};

export async function walkArticle(session: Session, data: Blocks.Article): Promise<ArticleState> {
  const images: ArticleState['images'] = {};

  const children: ArticleState['children'] = await Promise.all(
    data.order.map(async (k) => {
      const srcId = data.children[k]?.src;
      if (!srcId) return {};
      const child = await new Version(session, srcId).get();
      switch (child.data.kind) {
        case KINDS.Content: {
          const state = getEditorState(child.data.content);
          state.doc.descendants((node) => {
            switch (node.type.name) {
              case nodeNames.image: {
                const { src } = node.attrs as Nodes.Image.Attrs;
                const id = oxaLinkToId(src)?.block as VersionId;
                if (id) images[src] = new Version(session, id);
                break;
              }
              default:
                break;
            }
          });
          return { state, version: child };
        }
        case KINDS.Image: {
          const state = getEditorState(child.data.caption ?? '', 'paragraph');
          const key = oxaLink('', child.id);
          if (key) images[key] = child as Version<Blocks.Image>;
          return { state, version: child };
        }
        default:
          return {};
      }
    }),
  );

  return {
    children,
    images,
  };
}

export async function loadImagesToBuffers(images: ArticleState['images']) {
  const buffers: Record<string, Buffer> = {};

  await Promise.all(
    Object.entries(images).map(async ([key, image]) => {
      await image.get();
      if (image.data.kind !== KINDS.Image) return;
      const response = await fetch(image.data.links.download);
      const buffer = await response.buffer();
      buffers[key] = buffer;
    }),
  );
  return buffers;
}

function contentTypeToExt(contentType: string): string {
  switch (contentType) {
    case 'image/gif':
      return 'gif';
    case 'image/png':
      return 'png';
    case 'image/jpg':
    case 'image/jpeg':
      return 'jpg';
    default:
      throw new Error(`ContentType: "${contentType}" is not recognized`);
  }
}

function makeUniqueFilename(
  basePath: string,
  block: Block,
  version: Version<Blocks.Image>,
  taken: Set<string>,
): string {
  const ext = contentTypeToExt(version.data.content_type);
  const filenames = [
    block.data.name,
    version.data.file_name,
    `${version.id.project}-${version.id.block}-v${version.id.version}`,
  ]
    .map((filename) => {
      if (!filename) return '';
      let name = filename;
      if (!name.endsWith(ext)) name += `.${ext}`;
      const test = path.join(basePath, name);
      if (taken.has(test)) return '';
      return test;
    })
    .filter((n) => !!n);
  return filenames[0];
}

export async function writeImagesToFiles(images: ArticleState['images'], basePath: string) {
  const takenFilenames: Set<string> = new Set();
  const filenames: Record<string, string> = {};
  await Promise.all(
    Object.entries(images).map(async ([key, image]) => {
      const [block] = await Promise.all([new Block(image.session, image.id).get(), image.get()]);
      if (image.data.kind !== KINDS.Image) return;
      const response = await fetch(image.data.links.download);
      const buffer = await response.buffer();
      const filename = makeUniqueFilename(basePath, block, image, takenFilenames);
      if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(filename, buffer);
      filenames[key] = filename;
      takenFilenames.add(filename);
    }),
  );
  return filenames;
}
