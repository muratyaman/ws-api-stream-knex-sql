import { BasicService } from './basic-service.mjs';

export class Api extends BasicService {
  name = 'Api';
  constructor(config, logger, mainDb) {
    super();
    this._config = config;
    this._logger = logger;
    this._mainDb = mainDb;
  }

  async start() {
    // nothing to do
  }

  async stop() {
    // nothing to do
  }

  // this is a proxy method to find command and execute 
  async onMessage(payload, send) {
    this._logger.info('ApiService.onMessage()...', payload);
    const { meta = {} } = payload;
    const { kind } = meta || {};
    switch (kind) {
      case 'echo':
        await this._echo(payload, send);
        break;
      case 'select_user':
        await this._select_user(payload, send);
        break;
      case 'select_users':
        await this._select_users(payload, send);
        break;
      default:
        send({ meta, error: 'unknown message kind' });
        break;
    }
  }

  _makeStreamListener = (send, originalPayload) => {
    const { _logger } = this;
    const { meta } = originalPayload;
    function onStream(stream) {
      let idx = 0;
      stream.on('data', (data) => {
        idx++;
        _logger.debug('BasicDbRepo.selectMany() stream.on(data)...', { idx, data });
        send({ meta, data, idx });
      });
      stream.on('error', (err) => {
        idx++;
        _logger.warn('BasicDbRepo.selectMany() stream.on(error)...', { idx, err });
        send({ meta, data: null, last: true, error: err, idx });
      });
      stream.on('end', () => {
        idx++;
        _logger.debug('BasicDbRepo.selectMany() stream.on(end)...', { idx });
        send({ meta, data: null, last: true, idx });
      });
    }

    return onStream;
  }

  async _echo(payload, send) {
    return send({ ...payload, last: true });
  }

  async _select_user(payload, send) {
    const { meta = {}, data = {} } = payload;
    // criteria can be { id: 1 } or { rid: 'abc123' }
    const { columns = '*', offset = 0, limit = 10, criteria = {}, orderBy = 'id', orderDir = 'asc' } = data || {};
    const usersRepo = this._mainDb.usersRepo();
    const user = await usersRepo.selectOne({ columns, criteria, orderBy, orderDir, offset, limit });
    send({ meta, data: user, last: true });
  }

  async _select_users(payload, send) {
    const { data = {} } = payload;
    const { columns = '*', offset = 0, limit = 10, criteria = {}, orderBy = 'id', orderDir = 'asc' } = data || {};
    const usersRepo = this._mainDb.usersRepo();
    return usersRepo.selectMany({
        columns,
        criteria,
        orderBy,
        orderDir,
        offset,
        limit,
        originalPayload: payload,
        onStream: this._makeStreamListener(send, payload),
      });
  }
}
