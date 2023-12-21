import { BasicService } from '../basic-service.mjs';
import { BasicDbRepo } from './basic-db-repo.mjs';

export class BasicDb extends BasicService {
  name = 'BasicDb';
  _repoCache = new Map();

  constructor(_dbRw, _dbRo, _logger) {
    super();
    this._dbRw = _dbRw;
    this._dbRo = _dbRo;
    this._logger = _logger;
  }

  get dbRw() {
    return this._dbRw;
  }

  get dbRo() {
    return this._dbRo;
  }

  repo(tableName, BasicDbRepoConstructor = BasicDbRepo) {
    if (!this._repoCache.has(tableName)) {
      this._repoCache.set(tableName, new BasicDbRepoConstructor(this, tableName, this._logger));
    }
    return this._repoCache.get(tableName); // pretending but it's ok
  }

  async start() {
    this._logger.info(this.name + '.start()...');
    const rows1 = await this._dbRw.column(this._dbRw.raw('1 as status')).select();
    this._logger.info(this.name + '.start() rw db', rows1);

    const rows2 = await this._dbRo.column(this._dbRo.raw('1 as status')).select();
    this._logger.info(this.name + '.start() ro db', rows2);

    this._logger.info(this.name + '.start()... done!');
  }

  async stop() {
    this._logger.info(this.name + '.stop()...');
    await this._dbRw.destroy();
    await this._dbRo.destroy();
    this._logger.info(this.name + '.stop()... done!');
  }
}
