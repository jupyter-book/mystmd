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
  hast(h, node) {
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
  hast(h, node) {
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
  hast(h, node) {
    return null;
  },
};

function createCiteMdastHandler(type: string, kind: string): IRole['mdast'] {
  return {
    type,
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return { kind, label: t.content };
    },
  };
}
const CiteP: IRole = {
  myst: class CiteP extends Role {
    run(data: IRoleData) {
      const token = new this.state.Token('cite:p', 'cite', 1);
      token.content = data.content;
      return [token];
    }
  },
  mdast: createCiteMdastHandler('cite', 'p'),
  hast(h, node) {
    return null;
  },
};

export const reactiveRoles: Record<string, IRole> = {
  'r:dynamic': RDynamic,
  'r:display': RDisplay,
  'r:range': RRange,
  'cite:p': CiteP,
};
