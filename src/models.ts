import {
  MyUser as MyUserDTO,
  User as UserDTO,
  Project as ProjectDTO,
  Block as BlockDTO,
  ALL_BLOCKS,
  ProjectId,
  BlockId,
  VersionId,
  projectFromDTO,
  blockFromDTO,
  versionFromDTO,
  userFromDTO,
  myUserFromDTO,
  JsonObject,
} from '@curvenote/blocks';
import { BaseTransfer } from './base';
import { Session } from './session';
import { users, blocks, projects, versions } from './store';

export class MyUser extends BaseTransfer<string, MyUserDTO> {
  constructor(session: Session) {
    super(session, '');
  }

  kind = 'User';

  $fromDTO = myUserFromDTO;

  $createUrl = () => `/my/user`;

  $recieve = users.actions.recieve;
}

export class User extends BaseTransfer<string, UserDTO> {
  kind = 'User';

  $fromDTO = userFromDTO;

  $createUrl = () => `/users/${this.id}`;

  $recieve = users.actions.recieve;
}

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

export class Version<T extends ALL_BLOCKS = ALL_BLOCKS> extends BaseTransfer<VersionId, T> {
  kind = 'Version';

  $fromDTO = versionFromDTO as (versionId: VersionId, json: JsonObject) => T;

  $createUrl = () => `/blocks/${this.id.project}/${this.id.block}/versions/${this.id.version}`;

  $recieve = versions.actions.recieve;
}
