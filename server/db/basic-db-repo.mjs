export class BasicDbRepo {
  constructor(db, tableName, logger) {
    this._db = db;
    this.tableName = tableName;
    this._logger = logger;
  }

  _makeWhere = (criteria = {}) => {
    return (qry) => {
      // for each key in criteria, add a where clause
      for (const [key, val] of Object.entries(criteria)) {
        let op = '=', value = null;
        if (['string', 'number', 'boolean'].includes(typeof val)) {
          op = '=';
        } else if (typeof val === 'object') {
          if (Array.isArray(val)) {
            op = 'in';
            value = val;
          } else { // object
            const keys = Object.keys(val);
            if (keys.length === 1) {
              op = keys[0];
              value = val[op];
            }
          }
        }

        switch (op) {
          case '=':
          case 'eq':
          case '$eq':
            qry.where(key, value); break;

          case '<>':
          case 'neq':
          case '$neq':
            qry.whereNot(key, value); break;

          case 'null':
          case 'nil':
          case '$null':
          case '$nil':
            qry.whereNull(key); break;

          case 'nnull':
          case 'notnull':
          case 'notnil':
          case 'nnil':
          case '$notnull':
          case '$nnull':
          case '$notnil':
          case '$nnil':
            qry.whereNotNull(key); break;

          case 'like':
          case '$like':
            qry.whereLike(key, value); break;

          case 'ilike':
          case '$ilike':
            qry.whereILike(key, value); break;

          case 'in':
          case '$in':
            qry.whereIn(key, value); break;

          case 'nin':
          case 'notin':
          case '$nin':
          case '$notin':
            qry.whereNotIn(key, value); break;

          case '>':
          case 'gt':
          case '$gt':
            qry.where(key, '>', value); break;

          case '>=':
          case 'gte':
          case '$gte':
            qry.where(key, '>=', value); break;

          case '<':
          case 'lt':
          case '$lt':
            qry.where(key, '>', value); break;

          case '<=':
          case 'lte':
          case '$lte':
            qry.where(key, '<=', value); break;
        }
      }
    }
  }

  selectMany({
    columns = '*',
    criteria = {},
    orderBy = 'id',
    orderDir = 'asc',
    limit = 1000,
    offset = 0,
    originalPayload,
    onStream,
  }) {
    const { _logger } = this;
    if (limit > 1000) limit = 1000;
    const logObj = { columns, criteria, orderBy, orderDir, limit, offset, originalPayload };
    _logger.debug('BasicDbRepo.selectMany() start', logObj);

    return this._db.dbRo
      .select(columns)
      .from(this.tableName)
      .where(this._makeWhere(criteria))
      .orderBy(orderBy, orderDir)
      .limit(limit)
      .offset(offset)
      .stream(onStream);
  }

  selectOne({
    columns = '*',
    criteria = {},
    orderBy = 'id',
    orderDir = 'asc',
  }) {
    return this._db.dbRo
      .select(columns)
      .from(this.tableName)
      .where(this._makeWhere(criteria))
      .orderBy(orderBy, orderDir)
      .first();
  }

  insertOne(data) {
    return this._db.dbRw(this.tableName).insert(data);
  }

  updateById(id, data) {
    return this._db.dbRw(this.tableName).where({ id }).update(data);
  }

  deleteById(id) {
    return this._db.dbRw(this.tableName).where({ id }).del();
  }

}
