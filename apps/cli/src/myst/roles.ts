import type { IRoleData, IRole } from 'mystjs';
import { Role } from 'mystjs';

function parseRole(content?: string) {
  if (!content) return {};
  return Object.fromEntries(
    content.split('", ').map((part) => {
      const [name, value] = part.replace(/",?\s?$/, '').split('="');
      if (name.startsWith('r')) {
        const transformed = `${name.slice(1).toLowerCase()}Function`;
        return [transformed, value];
      }
      return [name, value];
    }),
  );
}

function createMdastHandler(type: string): IRole['mdast'] {
  return {
    type,
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return parseRole(t.content);
    },
  };
}

const RRange: IRole = {
  myst: class RRange extends Role {
    run(data: IRoleData) {
      const token = new this.state.Token('r:range', 'r-range', 1);
      token.content = data.content;
      return [token];
    }
  },
  mdast: createMdastHandler('r:range'),
  hast() {
    return null;
  },
};

const RDynamic: IRole = {
  myst: class RDynamic extends Role {
    run(data: IRoleData) {
      const token = new this.state.Token('r:dynamic', 'r-dynamic', 1);
      token.content = data.content;
      return [token];
    }
  },
  mdast: createMdastHandler('r:dynamic'),
  hast() {
    return null;
  },
};

const RDisplay: IRole = {
  myst: class RDisplay extends Role {
    run(data: IRoleData) {
      const token = new this.state.Token('r:display', 'r-display', 1);
      token.content = data.content;
      return [token];
    }
  },
  mdast: createMdastHandler('r:display'),
  hast() {
    return null;
  },
};

const citeMdastHandler: IRole['mdast'] = {
  type: 'citeGroup',
  noCloseToken: false,
  isLeaf: false,
  getAttrs(t) {
    return { kind: t.attrGet('kind') };
  },
};

const CiteP: IRole = {
  myst: class CiteP extends Role {
    run(data: IRoleData) {
      const open = new this.state.Token('cite_group_open', 'cite', 1);
      open.attrSet('kind', 'parenthetical');
      const labels = data.content?.split(/[,;]/).map((s) => s.trim()) ?? [];
      const citations = labels.map((label) => {
        const cite = new this.state.Token('cite', 'cite', 0);
        cite.attrSet('label', label);
        return cite;
      });
      const close = new this.state.Token('cite_group_close', 'cite', -1);
      return [open, ...citations, close];
    }
  },
  mdast: citeMdastHandler,
  hast() {
    return null;
  },
};

const CiteT: IRole = {
  myst: class CiteT extends Role {
    run(data: IRoleData) {
      const open = new this.state.Token('cite_group_open', 'cite', 1);
      open.attrSet('kind', 'narrative');
      const labels = data.content?.split(/[,;]/).map((s) => s.trim()) ?? [];
      const citations = labels.map((label) => {
        const cite = new this.state.Token('cite', 'cite', 0);
        cite.attrSet('label', label);
        return cite;
      });
      const close = new this.state.Token('cite_group_close', 'cite', -1);
      return [open, ...citations, close];
    }
  },
  mdast: citeMdastHandler,
  hast() {
    return null;
  },
};

const Cite: IRole = {
  myst: class Cite extends Role {
    run(data: IRoleData) {
      const labels = data.content?.split(/[,;]/).map((s) => s.trim()) ?? [];
      if (labels.length < 2) {
        const cite = new this.state.Token('cite', 'cite', 0);
        cite.attrSet('label', data.content);
        return [cite];
      }
      const open = new this.state.Token('cite_group_open', 'cite', 1);
      open.attrSet('kind', 'narrative');
      const citations = labels.map((label) => {
        const cite = new this.state.Token('cite', 'cite', 0);
        cite.attrSet('label', label);
        return cite;
      });
      const close = new this.state.Token('cite_group_close', 'cite', -1);
      return [open, ...citations, close];
    }
  },
  mdast: {
    type: 'cite',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        label: t.attrGet('label'),
        identifier: t.attrGet('label'),
      };
    },
  },
  hast() {
    return null;
  },
};

const Underline: IRole = {
  myst: class Underline extends Role {
    run(data: IRoleData) {
      const open = new this.state.Token('underline_open', 'u', 1);
      const text = new this.state.Token('text', '', 0);
      text.content = data.content;
      const close = new this.state.Token('underline_close', 'u', -1);
      return [open, text, close];
    }
  },
  mdast: {
    type: 'underline',
    noCloseToken: false,
    isLeaf: false,
  },
  hast() {
    return null;
  },
};

const Delete: IRole = {
  myst: class Delete extends Role {
    run(data: IRoleData) {
      const open = new this.state.Token('delete_open', 'u', 1);
      const text = new this.state.Token('text', '', 0);
      text.content = data.content;
      const close = new this.state.Token('delete_close', 'u', -1);
      return [open, text, close];
    }
  },
  mdast: {
    type: 'delete',
    noCloseToken: false,
    isLeaf: false,
  },
  hast() {
    return null;
  },
};

const SmallCaps: IRole = {
  myst: class SmallCaps extends Role {
    run(data: IRoleData) {
      const open = new this.state.Token('smallcaps_open', 'u', 1);
      const text = new this.state.Token('text', '', 0);
      text.content = data.content;
      const close = new this.state.Token('smallcaps_close', 'u', -1);
      return [open, text, close];
    }
  },
  mdast: {
    type: 'smallcaps',
    noCloseToken: false,
    isLeaf: false,
  },
  hast() {
    return null;
  },
};

const RRID: IRole = {
  myst: class RRID extends Role {
    run(data: IRoleData) {
      const rrid = new this.state.Token('rrid', 'cite', 0);
      rrid.attrSet('label', data.content);
      return [rrid];
    }
  },
  mdast: {
    type: 'rrid',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        label: t.attrGet('label'),
        identifier: t.attrGet('label'),
      };
    },
  },
  hast() {
    return null;
  },
};

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Reference <ref>'

const Wiki: IRole = {
  myst: class Wiki extends Role {
    run(data: IRoleData) {
      const wiki = new this.state.Token('wiki', 'cite', 0);
      const match = REF_PATTERN.exec(data.content);
      const [, title, name] = match ?? [];
      wiki.attrSet('title', title?.trim() ?? data.content);
      wiki.attrSet('name', name?.trim() ?? data.content);
      return [wiki];
    }
  },
  mdast: {
    type: 'wiki',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        title: t.attrGet('title'),
        name: t.attrGet('name'),
      };
    },
  },
  hast() {
    return null;
  },
};

const Chem: IRole = {
  myst: class Chem extends Role {
    run(data: IRoleData) {
      const chem = new this.state.Token('chem', 'code', 1);
      chem.content = data.content;
      return [chem];
    }
  },
  mdast: {
    type: 'chemicalFormula',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        value: t.content,
      };
    },
  },
  hast() {
    return null;
  },
};

const UNITS: Record<string, string> = {
  ampere: 'A',
  candela: 'cd',
  kelvin: 'K',
  kilogram: 'kg',
  metre: 'm',
  meter: 'm',
  mole: 'mol',
  second: 's',
  becquerel: 'Bq',
  degreeCelsius: '°C',
  coulomb: 'C',
  farad: 'F',
  gray: 'Gy',
  hertz: 'Hz',
  henry: 'H',
  joule: 'J',
  lumen: 'lm',
  katal: 'kat',
  lux: 'lx',
  newton: 'N',
  ohm: 'Ω',
  pascal: 'Pa',
  radian: 'rad',
  siemens: 'S',
  sievert: 'Sv',
  steradian: 'sr',
  tesla: 'T',
  volt: 'V',
  watt: 'W',
  weber: 'Wb',
  astronomicalunit: 'au',
  bel: 'B',
  dalton: 'Da',
  day: 'd',
  decibel: 'dB',
  degree: '°',
  electronvolt: 'eV',
  hectare: 'ha',
  hour: 'h',
  litre: 'L',
  liter: 'L',
  arcminute: '′', // minute (plane angle) U+2032
  minute: 'min', // minute (time)
  arcsecond: '″', // second (plane angle) U+2033
  neper: 'Np',
  tonne: 't',
  // SI prefixes
  yocto: 'y', // -24
  zepto: 'z', // -21
  atto: 'a', // -18
  femto: 'f', // -15
  pico: 'p', // -12
  nano: 'n', // -9
  micro: 'µ', // -6
  milli: 'm', // -3
  centi: 'c', // -2
  deci: 'd', // -1
  deca: 'da', // 1
  hecto: 'h', // 2
  kilo: 'k', // 3
  mega: 'M', // 6
  giga: 'G', // 9
  tera: 'T', // 12
  peta: 'P', // 15
  exa: 'E', // 18
  zetta: 'Z', // 21
  yotta: 'Y', // 24
  // Special
  angstrom: 'Å',
};

const SI: IRole = {
  myst: class SI extends Role {
    run(data: IRoleData) {
      const siunit = new this.state.Token('si', 'span', 1);
      const match = data.content.match(/([0-9]+)\s?<([\\a-zA-Z]+)>/);
      if (!match) {
        siunit.content = data.content;
        siunit.attrSet('error', 'true');
      } else {
        const [, num, units] = match;
        const parsed = [...units.matchAll(/\\([a-zA-Z]+)/g)];
        const translated = parsed.map(([, c]) => UNITS[c] ?? c);
        siunit.attrSet('number', num);
        siunit.attrSet('units', parsed.join(' '));
        siunit.content = `${num} ${translated.join('')}`;
      }
      return [siunit];
    }
  },
  mdast: {
    type: 'si',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      if (t.attrGet('error')) {
        return {
          value: t.content,
          error: true,
        };
      }
      return {
        value: t.content,
        number: t.attrGet('number'),
        units: t.attrGet('units'),
      };
    },
  },
  hast() {
    return null;
  },
};

export const reactiveRoles: Record<string, IRole> = {
  'r:dynamic': RDynamic,
  'r:display': RDisplay,
  'r:range': RRange,
  cite: Cite,
  'cite:p': CiteP,
  cite_group: CiteP,
  'cite:t': CiteT,
  u: Underline,
  underline: Underline,
  sc: SmallCaps,
  smallcaps: SmallCaps,
  del: Delete,
  strike: Delete,
  delete: Delete,
  rrid: RRID,
  wiki: Wiki,
  chem: Chem,
  chemicalFormula: Chem,
  si: SI,
};
