export class Config {

  constructor(env) {
    this.env = env;
  }

  get http() {
    return {
      port: this.env.int('HTTP_PORT', 8080),
    };
  }

  get logger() {
    return {
      level:  this.env.str('LOG_LEVEL', 'info'),
      pretty: this.env.bool('LOG_PRETTY', false),
    };
  }

  get mainDbRw() {
    return this.getDbConfig('MAIN_RW_');
  }

  get mainDbRo() {
    return this.getDbConfig('MAIN_RO_');
  }

  get otherDbRw() {
    return this.getDbConfig('OTHER_RW_');
  }

  get otherDbRo() {
    return this.getDbConfig('OTHER_RO_');
  }

  getDbConfig(dbKeyPrefix) {
    const env = this.env.newEnv(dbKeyPrefix);

    const dbUrl = env.str('DB_URL', 'mysql://root@127.0.0.1/test_db');
    const url = new URL(dbUrl);
    const schema = url.searchParams.get('schema') || 'public';

    let client = url.protocol.replace(':', ''); // 'mysql:' => 'mysql'
    if (client === 'mysql') client = 'mysql2';

    let port = Number.parseInt(url.port, 10);
    if (port <= 0 || Number.isNaN(port)) {
      if (client ==='mysql2') port = 3306;
      if (client === 'pg') port = 5432;
    }

    const database = url.pathname.replace('/', ''); // '/test_db' => 'test_db'

    return {
      knex: {
        client,
        connection: {
          host    : url.hostname,
          port,
          user    : url.username || '',
          password: url.password || '',
          database,
        },
        searchPath: [ schema ],
        useNullAsDefault: true,
        acquireConnectionTimeout: 5000,
        pool: {
          min: env.int('DB_POOL_MIN', 5),
          max: env.int('DB_POOL_MAX', 100),
        },
      },
    };
  }
}
