import type { RoleSpec, RoleData, GenericNode, DirectiveSpec, DirectiveData } from 'myst-common';

export const reactiveRole: RoleSpec = {
  name: 'r:range',
  alias: ['r:dynamic', 'r:display'],
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const parsedContent = Object.fromEntries(
      (data.body as string).split('", ').map((part) => {
        const [name, value] = part.replace(/",?\s?$/, '').split('="');
        if (name.startsWith('r')) {
          const transformed = `${name.slice(1).toLowerCase()}Function`;
          return [transformed, value];
        }
        return [name, value];
      }),
    );
    return [
      {
        type: data.name,
        ...parsedContent,
      },
    ];
  },
};

export const reactiveDirective: DirectiveSpec = {
  name: 'r:var',
  options: {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
    },
    rValue: {
      type: String,
    },
    format: {
      type: String,
    },
  },
  run(data: DirectiveData): GenericNode[] {
    const { name, value, rValue, format } = data.options ?? {};
    return [
      {
        type: 'r:var',
        name,
        value: value as string | undefined,
        valueFunction: rValue,
        format,
      },
    ];
  },
};

// export const reactiveHastHandler: Handler = (h, node) => h(node, 'r-var');
