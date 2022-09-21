import type * as spec from 'myst-spec';
import React, { useState } from 'react';
import type { NodeRenderer } from './types';
import {
  InformationCircleIcon,
  ExclamationIcon as OExclamationIcon,
  SpeakerphoneIcon,
  PencilAltIcon,
  ArrowCircleRightIcon,
} from '@heroicons/react/outline';
import {
  ExclamationIcon as SExclamationIcon,
  ExclamationCircleIcon as SExclamationCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  LightningBoltIcon,
  ChevronRightIcon,
} from '@heroicons/react/solid';
import classNames from 'classnames';
// import { AdmonitionKind } from 'mystjs';

// TODO: get this from myst-spec?
enum AdmonitionKind {
  admonition = 'admonition',
  attention = 'attention',
  caution = 'caution',
  danger = 'danger',
  error = 'error',
  important = 'important',
  hint = 'hint',
  note = 'note',
  seealso = 'seealso',
  tip = 'tip',
  warning = 'warning',
}

type ColorAndKind = {
  kind: AdmonitionKind;
  color: 'blue' | 'green' | 'yellow' | 'red';
};

function getClasses(className?: string) {
  const classes =
    className
      ?.split(' ')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => !!s) ?? [];
  return [...new Set(classes)];
}

function getFirstKind({
  kind,
  classes = [],
}: {
  kind?: AdmonitionKind | string;
  classes?: string[];
}): ColorAndKind {
  if (kind === AdmonitionKind.note || classes.includes('note')) {
    return { kind: AdmonitionKind.note, color: 'blue' };
  }
  if (kind === AdmonitionKind.important || classes.includes('important')) {
    return { kind: AdmonitionKind.important, color: 'blue' };
  }
  if (kind === AdmonitionKind.hint || classes.includes('hint')) {
    return { kind: AdmonitionKind.hint, color: 'green' };
  }
  if (kind === AdmonitionKind.seealso || classes.includes('seealso')) {
    return { kind: AdmonitionKind.seealso, color: 'green' };
  }
  if (kind === AdmonitionKind.tip || classes.includes('tip')) {
    return { kind: AdmonitionKind.tip, color: 'green' };
  }
  if (kind === AdmonitionKind.attention || classes.includes('attention')) {
    return { kind: AdmonitionKind.attention, color: 'yellow' };
  }
  if (kind === AdmonitionKind.warning || classes.includes('warning')) {
    return { kind: AdmonitionKind.warning, color: 'yellow' };
  }
  if (kind === AdmonitionKind.caution || classes.includes('caution')) {
    return { kind: AdmonitionKind.caution, color: 'yellow' };
  }
  if (kind === AdmonitionKind.danger || classes.includes('danger')) {
    return { kind: AdmonitionKind.danger, color: 'red' };
  }
  if (kind === AdmonitionKind.error || classes.includes('error')) {
    return { kind: AdmonitionKind.error, color: 'red' };
  }
  return { kind: AdmonitionKind.note, color: 'blue' };
}

const iconClass = 'h-8 w-8 inline-block pl-2 mr-2 -translate-y-[1px]';

function AdmonitionIcon({ kind }: { kind: AdmonitionKind }) {
  if (kind === AdmonitionKind.note) return <InformationCircleIcon className={iconClass} />;
  if (kind === AdmonitionKind.caution) return <OExclamationIcon className={iconClass} />;
  if (kind === AdmonitionKind.warning) return <SExclamationIcon className={iconClass} />;
  if (kind === AdmonitionKind.danger) return <SExclamationCircleIcon className={iconClass} />;
  if (kind === AdmonitionKind.error) return <XCircleIcon className={iconClass} />;
  if (kind === AdmonitionKind.attention) return <SpeakerphoneIcon className={iconClass} />;
  if (kind === AdmonitionKind.tip) return <PencilAltIcon className={iconClass} />;
  if (kind === AdmonitionKind.hint) return <LightBulbIcon className={iconClass} />;
  if (kind === AdmonitionKind.important) return <LightningBoltIcon className={iconClass} />;
  if (kind === AdmonitionKind.seealso) return <ArrowCircleRightIcon className={iconClass} />;
  return <InformationCircleIcon className={iconClass} />;
}

export const AdmonitionTitle: NodeRenderer<spec.AdmonitionTitle> = (node, children) => {
  return children;
};

function Admonition({
  title,
  kind,
  color,
  dropdown,
  children,
}: ColorAndKind & { title: React.ReactNode; children: React.ReactNode[]; dropdown: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={classNames(
        'admonition rounded-md my-4 border-l-4 shadow-md dark:shadow-2xl dark:shadow-neutral-900',
        {
          'border-blue-500': color === 'blue',
          'border-green-600': color === 'green',
          'border-amber-600': color === 'yellow',
          'border-red-600': color === 'red',
        },
      )}
    >
      <p
        className={classNames('admonition-header m-0 text-lg font-medium py-1', {
          'text-blue-600 bg-blue-50 dark:bg-slate-900': color === 'blue',
          'text-green-600 bg-green-50 dark:bg-slate-900': color === 'green',
          'text-amber-600 bg-amber-50 dark:bg-slate-900': color === 'yellow',
          'text-red-600 bg-red-50 dark:bg-slate-900': color === 'red',
          'cursor-pointer hover:shadow-[inset_0_0_0px_20px_#00000003] dark:hover:shadow-[inset_0_0_0px_20px_#FFFFFF03]':
            dropdown,
        })}
        onClick={dropdown ? () => setOpen(!open) : undefined}
      >
        <AdmonitionIcon kind={kind} />
        <span className="text-neutral-900 dark:text-white">
          {dropdown && (
            <span className="block float-right font-thin text-sm text-neutral-700 dark:text-neutral-200">
              {!open && 'Click to show'}
              <ChevronRightIcon
                className={classNames(iconClass, 'transition-transform', {
                  'rotate-90 -translate-y-[5px]': open,
                })}
              />
            </span>
          )}
          {title}
        </span>
      </p>
      {(!dropdown || open) && (
        <div className="px-4 py-1 bg-gray-50 dark:bg-stone-800">{children}</div>
      )}
    </aside>
  );
}

export const AdmonitionRenderer: NodeRenderer<spec.Admonition> = (node, children) => {
  const [title, ...rest] = children as any[];
  const classes = getClasses(node.class);
  const { kind, color } = getFirstKind({ kind: node.kind, classes });
  const isDropdown = classes.includes('dropdown');

  return (
    <Admonition key={node.key} title={title} kind={kind} color={color} dropdown={isDropdown}>
      {rest}
    </Admonition>
  );
};

const ADMONITION_RENDERERS = {
  admonition: AdmonitionRenderer,
  admonitionTitle: AdmonitionTitle,
};

export default ADMONITION_RENDERERS;
