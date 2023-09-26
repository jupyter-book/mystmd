import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { fileError, normalizeLabel, ParseTypesEnum, RuleId } from 'myst-common';
import type { VFile } from 'vfile';

export const listTableDirective: DirectiveSpec = {
  name: 'list-table',
  arg: {
    type: ParseTypesEnum.parsed,
  },
  options: {
    label: {
      type: ParseTypesEnum.string,
      alias: ['name'],
    },
    'header-rows': {
      type: ParseTypesEnum.number,
      // nonnegative int
    },
    // 'stub-columns': {
    //   type: ParseTypesEnum.number,
    //   // nonnegative int
    // },
    // width: {
    //   type: ParseTypesEnum.string,
    //   // length_or_percentage_or_unitless,
    // },
    // widths: {
    //   type: ParseTypesEnum.string,
    //   // TODO use correct widths option validator
    // },
    class: {
      type: ParseTypesEnum.string,
      // class_option: list of strings?
    },
    align: {
      type: ParseTypesEnum.string,
      // choice(['left', 'center', 'right'])
    },
  },
  body: {
    type: ParseTypesEnum.parsed,
    required: true,
  },
  validate(data: DirectiveData, vfile: VFile) {
    const validatedData = { ...data };
    const parsedBody = data.body as GenericNode[];
    if (parsedBody.length !== 1 || parsedBody[0].type !== 'list') {
      fileError(vfile, 'list-table directive must have one list as body', {
        ruleId: RuleId.directiveBodyCorrect,
      });
      validatedData.body = [];
    } else {
      parsedBody[0].children?.forEach((listItem) => {
        if (!(validatedData.body as GenericNode[]).length) return;
        if (
          listItem.type !== 'listItem' ||
          listItem.children?.length !== 1 ||
          listItem.children[0]?.type !== 'list'
        ) {
          fileError(vfile, 'list-table directive must have a list of lists', {
            ruleId: RuleId.directiveBodyCorrect,
          });
          validatedData.body = [];
        }
      });
    }
    return validatedData;
  },
  run(data: DirectiveData): GenericNode[] {
    const children = [];
    if (data.arg) {
      children.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      });
    }
    const topListChildren = (data.body as GenericNode[])[0]?.children || [];
    let headerCount = (data.options?.['header-rows'] as number) || 0;
    const table = {
      type: 'table',
      align: data.options?.align,
      children: topListChildren.map((topListItem) => {
        const nestedListChildren = topListItem.children?.[0]?.children || [];
        const row = {
          type: 'tableRow',
          children: nestedListChildren.map((nestedListItem) => {
            const cell = {
              type: 'tableCell',
              header: headerCount > 0 ? true : undefined,
              children: nestedListItem.children,
            };
            return cell;
          }),
        };
        headerCount -= 1;
        return row;
      }),
    };
    children.push(table);
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const container = {
      type: 'container',
      kind: 'table',
      identifier,
      label,
      class: data.options?.class,
      children,
    };
    return [container];
  },
};
