import path from 'path';
import fsp from 'fs/promises';
import fs from 'fs';
import { createHash } from 'crypto';
import { CellOutputMimeTypes } from '@curvenote/blocks';
import { IFileObject, IFileObjectFactoryFn, Metadata } from '@curvenote/nbtx';
import { Logger } from 'src/logging';

enum FileExtension {
  png = 'png',
  jpg = 'jpg',
  gif = 'gif',
  bmp = 'bmp',
  svg = 'svg',
  txt = 'txt',
  html = 'html',
}

const FileExtensionMap: Record<string, FileExtension> = {
  [CellOutputMimeTypes.ImagePng]: FileExtension.png,
  [CellOutputMimeTypes.ImageJpeg]: FileExtension.jpg,
  [CellOutputMimeTypes.ImageGif]: FileExtension.gif,
  [CellOutputMimeTypes.ImageBmp]: FileExtension.bmp,
  [CellOutputMimeTypes.ImageSvg]: FileExtension.svg,
  [CellOutputMimeTypes.TextPlain]: FileExtension.txt,
  [CellOutputMimeTypes.TextHtml]: FileExtension.html,
};

function computeHash(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export class WebFileObject implements IFileObject {
  log: Logger;

  publicPath: string;

  filePath: string;

  useHash: boolean;

  hash?: string;

  contentType?: string;

  constructor(log: Logger, publicPath: string, filePath: string, useHash = false) {
    this.log = log;
    this.publicPath = publicPath;
    this.filePath = filePath;
    this.useHash = useHash;
    this.log.debug(`WebFileObject created ${filePath} - useHash ${useHash}`);
  }

  get id() {
    const ext: FileExtension | undefined = this.contentType
      ? FileExtensionMap[this.contentType]
      : undefined;
    const fullPath =
      this.useHash && this.hash ? path.join(this.filePath, this.hash) : this.filePath;
    return ext ? `${fullPath}.${ext}` : fullPath;
  }

  writeString(data: string, contentType: string): Promise<void> {
    this.contentType = contentType;
    if (!FileExtensionMap[contentType]) this.log.warn(`Unknown content type ${contentType}`);
    this.hash = computeHash(data);
    this.log.info(`📃 writing text output file ${data.length} bytes`);
    return fsp.writeFile(path.join(this.publicPath, this.id), data, { encoding: 'utf8' });
  }

  writeBase64(data: string): Promise<void> {
    const justData = data.replace('data:image/png;base64,', '');
    this.hash = computeHash(justData);
    this.log.info(`🖼 writing binary output file ${justData.length} bytes`);
    return fsp.writeFile(path.join(this.publicPath, this.id), justData, {
      encoding: 'base64',
    });
  }

  setContentType(contentType: string): Promise<Metadata> {
    this.log.debug('WebFileObject:setContentType', contentType);
    this.contentType = contentType;
    if (!FileExtensionMap[contentType]) this.log.warn(`Unknown content type ${contentType}`);
    return Promise.resolve({ contentType } as Metadata);
  }

  async url() {
    this.log.debug(`WebFileObject:url - file://${this.filePath}`);
    return `file://${this.filePath}`;
  }

  exists() {
    this.log.debug('WebFileObject:exists');
    return fs.existsSync(this.filePath);
  }
}

export function createWebFileObjectFactory(
  log: Logger,
  publicPath: string,
  staticPath: string,
  options: { useHash: boolean },
): IFileObjectFactoryFn {
  if (!fs.existsSync(staticPath)) fsp.mkdir(staticPath, { recursive: true });
  return (filepath: string) =>
    new WebFileObject(
      log,
      publicPath,
      options.useHash ? staticPath : path.join(staticPath, filepath),
      options.useHash,
    );
}
