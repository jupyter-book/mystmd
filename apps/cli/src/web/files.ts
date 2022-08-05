import fs from 'fs';
import path from 'path';
import { KnownCellOutputMimeTypes } from '@curvenote/blocks';
import type { IFileObject, IFileObjectFactoryFn, Metadata } from '@curvenote/nbtx';
import type { Logger } from '../logging';
import { computeHash } from '../utils';

enum FileExtension {
  png = 'png',
  jpg = 'jpg',
  gif = 'gif',
  bmp = 'bmp',
  svg = 'svg',
  json = 'json',
}

const FileExtensionMap: Record<string, FileExtension> = {
  [KnownCellOutputMimeTypes.ImagePng]: FileExtension.png,
  [KnownCellOutputMimeTypes.ImageJpeg]: FileExtension.jpg,
  [KnownCellOutputMimeTypes.ImageGif]: FileExtension.gif,
  [KnownCellOutputMimeTypes.ImageBmp]: FileExtension.bmp,
  [KnownCellOutputMimeTypes.ImageSvg]: FileExtension.svg,
  [KnownCellOutputMimeTypes.AppJson]: FileExtension.json,
};

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

  /**
   * writeString data to a json file, containing the data and it's content type
   *
   * @param data: string - any string/text data
   * @param contentType: string - the mime type of the data
   * @returns Promise<void>
   */
  async writeString(data: string, contentType: string) {
    this.contentType = KnownCellOutputMimeTypes.AppJson;
    this.hash = computeHash(data);
    this.log.debug(`Writing json output file for ${contentType} with ${data.length} bytes`);
    const json = JSON.stringify({ content_type: contentType, content: data });
    fs.writeFileSync(path.join(this.publicPath, this.id), json, { encoding: 'utf8' });
  }

  /**
   * Write a base64 encoded image to a file.
   *
   * NOTE: in order for the id and filename to be correct, the contentType must be set before calling this method.
   *
   * @param data: string - the base64 encoded image data
   * @param contentType: string | undefined - the mime type of the data, which if supplied will be used as fallback
   * @returns
   */
  async writeBase64(data: string, contentType?: string) {
    const [justData, header] = data.split(';base64,').reverse(); // reverse as sometimes there is no header
    this.contentType = header?.replace('data:', '') ?? contentType;
    this.hash = computeHash(justData);
    this.log.debug(`Writing binary output file ${justData.length} bytes`);
    fs.writeFileSync(path.join(this.publicPath, this.id), justData, {
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

  async exists() {
    this.log.debug('WebFileObject:exists');
    return new Promise<boolean>((resolve) => fs.exists(this.filePath, (e: boolean) => resolve(e)));
  }
}

export function createWebFileObjectFactory(
  log: Logger,
  publicPath: string,
  staticPath: string,
  options: { useHash: boolean },
): IFileObjectFactoryFn {
  if (!fs.existsSync(path.join(publicPath, staticPath))) {
    fs.mkdirSync(path.join(publicPath, staticPath), { recursive: true });
  }
  return (filepath: string) =>
    new WebFileObject(
      log,
      publicPath,
      options.useHash ? staticPath : path.join(staticPath, filepath),
      options.useHash,
    );
}
