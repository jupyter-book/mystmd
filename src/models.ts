import { AnyAction } from '@reduxjs/toolkit';
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
import { ISession } from './session/types';
import { selectors, RootState } from './store';
import { users, teams, blocks, projects, versions, templates } from './store/api';
import { versionIdToURL } from './utils';

/** Base class for API models */
class BaseTransfer<
  ID,
  DTO extends { id: ID },
  GetOptions extends Record<string, string> = Record<string, never>,
> {
  modelKind = '';

  session: ISession;

  id: ID;

  $data?: DTO;

  $fromDTO: (id: ID, json: JsonObject) => DTO = () => {
    throw new Error('Must be set in base class');
  };

  $createUrl: () => string = () => {
    throw new Error('Must be set in base class');
  };

  $selector?: (state: RootState, id: ID) => DTO;

  $receive?: (dto: DTO) => AnyAction;

  constructor(session: ISession, id: ID) {
    this.id = id;
    this.session = session;
  }

  get data(): DTO {
    if (this.$data) return this.$data;
    throw new Error(`${this.modelKind}: Must call "get" first`);
  }

  set data(data: DTO) {
    this.id = data.id;
    this.$data = this.$fromDTO(data.id, data);
    if (this.$receive) this.session.store.dispatch(this.$receive(data));
  }

  async get(query?: GetOptions) {
    const url = this.$createUrl();
    const fromSession = this.$selector?.(this.session.store.getState(), this.id);
    if (fromSession) {
      this.session.log.debug(`Loading ${this.modelKind} from cache: "${url}"`);
      this.data = fromSession;
      return this;
    }
    this.session.log.debug(`Fetching ${this.modelKind}: "${url}"`);
    const { ok, json } = await this.session.get(url, query);
    if (!ok) {
      if ('message' in json) {
        throw new Error(`${this.modelKind}: (${url}) ${json.message}`);
      }
      throw new Error(`${this.modelKind}: Not found (${url}) or you do not have access.`);
    }
    this.data = json as any;
    return this;
  }
}

export class MyUser extends BaseTransfer<string, MyUserDTO> {
  constructor(session: ISession) {
    super(session, '');
  }

  modelKind = 'User';

  $fromDTO = myUserFromDTO;

  $createUrl = () => `/my/user`;

  $receive = users.actions.receive;

  // TODO: $selector for MyUser that looks at the session
}

export class User extends BaseTransfer<string, UserDTO> {
  modelKind = 'User';

  $fromDTO = userFromDTO;

  $createUrl = () => `/users/${this.id}`;

  $receive = users.actions.receive;

  $selector = selectors.selectUser;
}

export class Team extends BaseTransfer<string, TeamDTO> {
  modelKind = 'Team';

  $fromDTO = teamFromDTO;

  $createUrl = () => `/teams/${this.id}`;

  $receive = teams.actions.receive;

  $selector = selectors.selectTeam;
}

export class Project extends BaseTransfer<ProjectId, ProjectDTO> {
  modelKind = 'Project';

  $fromDTO = projectFromDTO;

  $createUrl = () => `/projects/${this.id}`;

  $receive = projects.actions.receive;

  $selector = selectors.selectProject;
}

export class Block extends BaseTransfer<BlockId, BlockDTO> {
  modelKind = 'Block';

  $fromDTO = blockFromDTO;

  $createUrl = () => `/blocks/${this.id.project}/${this.id.block}`;

  $receive = blocks.actions.receive;

  $selector = selectors.selectBlock;
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

  $receive = versions.actions.receive;

  $selector = selectors.selectVersion;
}

export class Template extends BaseTransfer<string, TemplateSpec & { id: string }> {
  modelKind = 'Template';

  // TODO better unpacking and defaults on the dto contents
  $fromDTO = (id: string, json: JsonObject) => ({ id, ...json } as TemplateSpec & { id: string });

  $createUrl = () => `/templates/${this.id}`;

  $receive = templates.actions.receive;

  $selector = selectors.selectTemplate;
}
