import {
  Project as ProjectDTO,
  Block as BlockDTO,
  ALL_BLOCKS,
  ProjectId,
  BlockId,
  VersionId,
  projectFromDTO,
  blockFromDTO,
  versionFromDTO,
} from '@curvenote/blocks';
import { BaseTransfer } from './base';
import { blocks, projects, versions } from './store';

export class Project extends BaseTransfer<ProjectId, ProjectDTO> {
  kind = 'Project';

  $fromDTO = projectFromDTO;

  $createUrl = () => `/projects/${this.id}`;

  $recieve = projects.actions.recieve;
}

export class Block extends BaseTransfer<BlockId, BlockDTO> {
  kind = 'Block';

  $fromDTO = blockFromDTO;

  $createUrl = () => `/blocks/${this.id.project}/${this.id.block}`;

  $recieve = blocks.actions.recieve;
}

export class Version extends BaseTransfer<VersionId, ALL_BLOCKS> {
  kind = 'Version';

  $fromDTO = versionFromDTO;

  $createUrl = () => `/blocks/${this.id.project}/${this.id.block}/versions/${this.id.version}`;

  $recieve = versions.actions.recieve;
}
