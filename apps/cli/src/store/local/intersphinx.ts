import fs from 'fs';
import zlib from 'zlib';
import fetch from 'node-fetch';
import { isUrl } from '../../utils';

export type InventoryItem = { location: string; display?: string };
export type InventoryData = Record<string, Record<string, InventoryItem>>;

const DEFAULT_INV_NAME = 'objects.inv';

export class Inventory {
  path: string;

  /**
   * Place to look for the inv file, by default it is "objects.inv"
   */
  invName = DEFAULT_INV_NAME;
  name: string;
  project?: string;
  version?: string;

  numEntries?: number;
  data: InventoryData;

  constructor(opts: { name: string; path: string; invName?: string }) {
    this.name = opts.name;
    if (isUrl(opts.path)) {
      this.path = opts.path.replace(/\/$/, ''); // Remove any trailing slash
      this.invName = opts.invName || DEFAULT_INV_NAME;
    } else {
      this.path = opts.path; // Local path
    }
    this.data = {};
  }

  write(path: string) {
    const header = [
      `# Sphinx inventory version 2`,
      `# Project: ${this.project}`,
      `# Version: ${this.version}`,
      `# The remainder of this file is compressed using zlib.`,
    ].join('\n');

    // https://github.com/sphinx-doc/sphinx/blob/5e9550c78e3421dd7dcab037021d996841178f67/sphinx/util/inventory.py#L154
    const data = zlib.deflateSync(
      [
        'start:install std:label -1 start/overview.html#start-install Install Jupyter Book\n', // needs trailing new line
        'my-fig-ref std:label -1 content/references.html#$ My figure title.\n', // needs trailing new line
      ].join(''),
    );
    fs.writeFileSync(path, `${header}\r\n${data.toString('binary')}`, { encoding: 'binary' });
  }

  _loaded = false;

  async load() {
    if (this._loaded) return;
    let buffer: Buffer;
    if (isUrl(this.path)) {
      const url = `${this.path}/${this.invName || DEFAULT_INV_NAME}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `Error fetching intersphinx from "${url}": ${res.status} ${res.statusText}`,
        );
      }
      buffer = await res.buffer();
    } else {
      buffer = fs.readFileSync(this.path);
    }
    const str = buffer.toString('binary');
    const [header, projectInfo, versionInfo, zlibInfo, ...rest] = str.split('\n');

    if (!header.includes('version 2')) {
      throw new Error('Can only read version 2 inv files');
    }
    if (!zlibInfo.includes('compressed using zlib')) {
      throw new Error('Last line of header must include: "compressed using zlib"');
    }
    this.project = projectInfo.slice(11).trim();
    this.version = versionInfo.slice(11).trim();
    const compressed = Buffer.from(rest.join('\n'), 'binary');
    const re = zlib.inflateSync(compressed);

    let entries = 0;
    re.toString()
      .split('\n')
      .forEach((s) => {
        const pattern = /(.+?)\s+(\S+)\s+(-?\d+)\s+?(\S*)\s+(.*)/;
        const match = s.match(pattern);
        if (!match) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [, name, type, priority, location, display] = match;
        if (!type.includes(':')) {
          // wrong type value. type should be in the form of "{domain}:{objtype}"
          return;
        }
        if (type === 'py:module' && this.getEntry({ type, name })) {
          // due to a bug in 1.1 and below,
          // two inventory entries are created
          // for Python modules, and the first
          // one is correct
          return;
        }
        entries++;
        this.setEntry(type, name, location, display);
      });
    this.numEntries = entries;
    this._loaded = true;
  }

  setEntry(type: string, name: string, location: string, display: string) {
    if (!this.data[type]) this.data[type] = {};
    let resolvedLocation = location;
    if (location.endsWith('$')) {
      resolvedLocation = location.slice(0, -1) + name.toLowerCase().replace(/\s+/g, '-');
    }
    const resolvedDisplay = display.trim() === '-' ? undefined : display.trim();
    this.data[type][name] = { location: resolvedLocation, display: resolvedDisplay };
  }

  getEntry(opts: {
    type?: string;
    name: string;
  }): { location: string; display?: string } | undefined {
    if (!opts.type) {
      const type = Object.keys(this.data).find((t) => !!this.data[t][opts.name]);
      if (!type) return undefined;
      return this.getEntry({ type, name: opts.name });
    }
    const entry = this.data[opts.type]?.[opts.name];
    if (!entry) return undefined;
    return { location: `${this.path}/${entry.location}`, display: entry.display };
  }
}
