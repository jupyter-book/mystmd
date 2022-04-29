import {
  MyUser as MyUserDTO,
  User as UserDTO,
  Team as TeamDTO,
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
  teamFromDTO,
  FormatTypes,
  TemplateSpec,
} from '@curvenote/blocks';
import { BaseTransfer } from './base';
import { ISession } from './session/types';
import { users, teams, blocks, projects, versions, templates } from './store/api';
import {
  selectBlock,
  selectProject,
  selectTeam,
  selectUser,
  selectVersion,
  selectTemplate,
} from './store/selectors';
import { versionIdToURL } from './utils';

export class MyUser extends BaseTransfer<string, MyUserDTO> {
  constructor(session: ISession) {
    super(session, '');
  }

  modelKind = 'User';

  $fromDTO = myUserFromDTO;

  $createUrl = () => `/my/user`;

  $recieve = users.actions.recieve;

  // TODO: $selector for MyUser that looks at the session
}

export class User extends BaseTransfer<string, UserDTO> {
  modelKind = 'User';

  $fromDTO = userFromDTO;

  $createUrl = () => `/users/${this.id}`;

  $recieve = users.actions.recieve;

  $selector = selectUser;
}

export class Team extends BaseTransfer<string, TeamDTO> {
  modelKind = 'Team';

  $fromDTO = teamFromDTO;

  $createUrl = () => `/teams/${this.id}`;

  $recieve = teams.actions.recieve;

  $selector = selectTeam;
}

export class Project extends BaseTransfer<ProjectId, ProjectDTO> {
  modelKind = 'Project';

  $fromDTO = projectFromDTO;

  $createUrl = () => `/projects/${this.id}`;

  $recieve = projects.actions.recieve;

  $selector = selectProject;
}

export class Block extends BaseTransfer<BlockId, BlockDTO> {
  modelKind = 'Block';

  $fromDTO = blockFromDTO;

  $createUrl = () => `/blocks/${this.id.project}/${this.id.block}`;

  $recieve = blocks.actions.recieve;

  $selector = selectBlock;
}

export type VersionQueryOpts = { format?: FormatTypes };

export class Version<T extends ALL_BLOCKS = ALL_BLOCKS> extends BaseTransfer<
  VersionId,
  T,
  VersionQueryOpts
> {
  modelKind = 'Version';

  $fromDTO = versionFromDTO as (versionId: VersionId, json: JsonObject) => T;

  $createUrl = () => versionIdToURL(this.id);

  $recieve = versions.actions.recieve;

  $selector = selectVersion;
}

export class Template extends BaseTransfer<string, TemplateSpec & { id: string }> {
  modelKind = 'Template';

  // TODO better unpacking and defaults on the dto contents
  $fromDTO = (id: string, json: JsonObject) => ({ id, ...json } as TemplateSpec & { id: string });

  $createUrl = () => `/templates/${this.id}`;

  $recieve = templates.actions.recieve;

  $selector = selectTemplate;
}
