import { Role, IRoleData, IRole } from 'mystjs';

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
      const cite = new this.state.Token('cite', 'cite', 0);
      // if more than one, create a group...
      cite.attrSet('label', data.content);
      return [cite];
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

export const reactiveRoles: Record<string, IRole> = {
  'r:dynamic': RDynamic,
  'r:display': RDisplay,
  'r:range': RRange,
  cite: Cite,
  'cite:p': CiteP,
  cite_group: CiteP,
  'cite:t': CiteT,
  u: Underline,
  sc: SmallCaps,
  underline: Underline,
  smallcaps: SmallCaps,
};
