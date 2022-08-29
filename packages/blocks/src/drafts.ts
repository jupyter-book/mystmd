import { getDate } from '@curvenote/validators';
import type { JsonObject, BaseLinks } from './types';
import type { KINDS, ALL_PARTIAL_BLOCKS_INTERNAL, DraftId, BasePartialVersion } from './blocks';
import { blocks, partialVersionFromDTO } from './blocks';

export interface DraftLinks extends BaseLinks {
  block: string;
  children: string;
  parent?: string;
  child?: string;
  steps?: string;
}

export interface PartialDraft {
  id: DraftId;
  data: Partial<ALL_PARTIAL_BLOCKS_INTERNAL> & Partial<BasePartialVersion>;
}

export interface Draft extends PartialDraft {
  kind: KINDS;
  parent: number | null;
  child: number | null;
  next_step?: number;
  locked: boolean;
  merged: boolean;
  merged_by: string | null;
  created_by: string;
  date_created: Date;
  date_modified: Date;
  links: DraftLinks;
}

export type StepId = {
  project: string;
  block: string;
  draft: string;
  step: number;
};

export interface PartialStep {
  id: StepId;
  client: number;
  step: JsonObject;
}

export interface Step extends PartialStep {
  created_by: string;
  date_created: Date;
}

export function draftFromDTO(draftId: DraftId, json: JsonObject): Draft {
  const initialData = json.data ?? {};
  const data: JsonObject = {};
  const validVersion = {
    ...partialVersionFromDTO({ ...initialData }),
    ...blocks[json.kind as KINDS].fromDTO({ ...initialData }),
  };
  Object.keys(initialData).forEach((k) => {
    data[k] = validVersion[k] ?? initialData[k];
  });
  return {
    id: { ...draftId },
    kind: json.kind,
    data: data as Partial<ALL_PARTIAL_BLOCKS_INTERNAL>,
    parent: json.parent ?? null,
    child: json.child ?? null,
    next_step: json.next_step ?? 0,
    locked: json.locked ?? false,
    merged: json.merged ?? false,
    merged_by: json.merged_by ?? null,
    created_by: json.created_by ?? null,
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
  };
}

export function stepFromDTO(stepId: StepId, json: JsonObject): Step {
  return {
    id: { ...stepId },
    client: json.client,
    step: typeof json.step === 'string' ? JSON.parse(json.step) : json.step,
    created_by: json.created_by ?? null,
    date_created: getDate(json.date_created),
  };
}
