import { Api } from './api.mjs';
import { Config } from './config.mjs';
import { Env } from './env.mjs';
import { MainDb } from './db/main-db/index.mjs';
import { HttpAndWsService } from './http-and-ws.mjs';
import { newLogger } from './logger.mjs';
import { PayloadAdapter } from './payload-adapter.mjs';

export async function factory(penv = process.env) {
  const env = new Env(penv);
  const config = new Config(env);
  const logger = newLogger(config);

  const mainDb = new MainDb(config, logger);

  const api = new Api(config, logger, mainDb);

  const payloadAdapter = new PayloadAdapter();

  const httpAndWs = new HttpAndWsService(config, logger, payloadAdapter, api);
  
  async function start() {
    logger.info('Starting...');
    await mainDb.start();
    //await otherDb.start();
    await api.start();
    await httpAndWs.start();
  }

  async function stop() {
    logger.info('Stopping...');
    await httpAndWs.stop();
    await api.stop();
    await mainDb.stop();
    //await otherDb.stop();
  }

  return {
    penv,
    env,
    config,
    mainDb,
    api,
    httpAndWs,
    start,
    stop,
  };
}
