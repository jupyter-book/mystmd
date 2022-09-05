import type * as spec from 'myst-spec';
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

export const AdmonitionTitle: NodeRenderer<spec.AdmonitionTitle> = (node, children) => {
  return children;
};

export const Admonition: NodeRenderer<spec.Admonition> = (node, children) => {
  const [title, ...rest] = children as any[];

  // TODO: react to classes as well!
  const isAdmonition = !node.kind || (node.kind as string) === AdmonitionKind.admonition;
  const isAttention = node.kind === AdmonitionKind.attention;
  const isCaution = node.kind === AdmonitionKind.caution;
  const isDanger = node.kind === AdmonitionKind.danger;
  const isError = node.kind === AdmonitionKind.error;
  const isImportant = node.kind === AdmonitionKind.important;
  const isHint = node.kind === AdmonitionKind.hint;
  const isNote = node.kind === AdmonitionKind.note;
  const isSeealso = node.kind === AdmonitionKind.seealso;
  const isTip = node.kind === AdmonitionKind.tip;
  const isWarning = node.kind === AdmonitionKind.warning;

  const iconClass = 'h-8 w-8 inline-block pl-2 mr-2 -translate-y-[1px]';
  return (
    <aside
      key={node.key}
      className={classNames(
        'admonition rounded-md my-4 border-l-4 shadow-md dark:shadow-2xl dark:shadow-neutral-900 overflow-hidden',
        {
          'border-blue-500': isAdmonition || isNote || isImportant,
          'border-amber-600': isAttention || isCaution || isWarning,
          'border-red-600': isDanger || isError,
          'border-green-600': isHint || isSeealso || isTip,
        },
      )}
    >
      <p
        key={node.key}
        className={classNames('admonition-header m-0 text-lg font-medium py-1', {
          'text-blue-600 bg-blue-50 dark:bg-slate-900': isAdmonition || isNote || isImportant,
          'text-amber-600 bg-amber-50 dark:bg-slate-900': isAttention || isCaution || isWarning,
          'text-red-600 bg-red-50 dark:bg-slate-900': isDanger || isError,
          'text-green-600 bg-green-50 dark:bg-slate-900': isHint || isSeealso || isTip,
        })}
      >
        {(isAdmonition || isNote) && <InformationCircleIcon className={iconClass} />}
        {isCaution && <OExclamationIcon className={iconClass} />}
        {isWarning && <SExclamationIcon className={iconClass} />}
        {isDanger && <SExclamationCircleIcon className={iconClass} />}
        {isError && <XCircleIcon className={iconClass} />}
        {isAttention && <SpeakerphoneIcon className={iconClass} />}
        {isTip && <PencilAltIcon className={iconClass} />}
        {isHint && <LightBulbIcon className={iconClass} />}
        {isImportant && <LightningBoltIcon className={iconClass} />}
        {isSeealso && <ArrowCircleRightIcon className={iconClass} />}
        <span className="text-neutral-900 dark:text-white">{title}</span>
      </p>
      <div className="px-4 py-1 bg-gray-50 dark:bg-stone-800">{rest}</div>
    </aside>
  );
};

const ADMONITION_RENDERERS = {
  admonition: Admonition,
  admonitionTitle: AdmonitionTitle,
};

export default ADMONITION_RENDERERS;
