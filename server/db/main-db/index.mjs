import knex from 'knex';
import { BasicDb } from '../basic-db.mjs';
import { UsersRepo } from './users-repo.mjs';

export class MainDb extends BasicDb {
  name = 'MainDb';
  constructor(config, _logger) {
    const _dbRw = knex(config.mainDbRw.knex);
    const _dbRo = knex(config.mainDbRo.knex);
    super(_dbRw, _dbRo, _logger);
  }

  usersRepo() {
    return this.repo('tbl_user', UsersRepo);
  }
}
