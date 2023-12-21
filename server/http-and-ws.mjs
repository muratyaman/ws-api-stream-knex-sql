import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { BasicService } from './basic-service.mjs';

export class HttpAndWsService extends BasicService {
  name = 'HttpAndWsService';
  constructor(
    config,
    logger,
    payloadAdapter,
    msgProcessor,
  ) {
    super();
    this._config         = config;
    this._logger         = logger;
    this._payloadAdapter = payloadAdapter;
    this._msgProcessor   = msgProcessor;

    this._httpServer = createServer((_req, res) => {
      // basic response
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('hello world');
    });

    this._wsServer = new WebSocketServer({
      server: this._httpServer,
    });
  }

  _onWsMessage = (ws, message, isBinary) => {
    const { _logger, _payloadAdapter, _msgProcessor } = this;
    _logger.info('HttpAndWsService._onWsMessage...', { isBinary });

    if (!(message instanceof Buffer)) {
      _logger.warn('HttpAndWsService._onWsMessage() message must be Buffer');
      return; // early exit
    }

    const payload = _payloadAdapter.decode(message);
    _logger.info('HttpAndWsService._onWsMessage()...', payload);
    const send = msg => ws.send(_payloadAdapter.encode(msg));
    _msgProcessor.onMessage(payload, send);
  }

  _onWssConnection = (ws) => {
    const { _logger, _onWsMessage } = this;
    _logger.info('HttpAndWsService._onWsConnection()...');
    ws.on('message', (message, isBinary) => {
      _onWsMessage(ws, message, isBinary); // we need to pass ws
    });
  }

  _onWssError = (err) => {
    this._logger.info('HttpAndWsService._onWssError...', err);
  }

  _onWssClose = () => {
    this._logger.info('HttpAndWsService._onWssClose...');
  }

  async start() {
    const { _config, _logger, _httpServer, _wsServer, _onWssConnection, _onWssError, _onWssClose } = this;
    this._logger.info('HttpAndWsService.start()...');
    await new Promise((resolve, _reject) => {
      _httpServer.listen(_config.http.port, () => {
        _logger.info('HttpAndWsService.start()... done! port', _config.http.port);
        _wsServer.on('connection', _onWssConnection);
        _wsServer.on('error', _onWssError);
        _wsServer.on('close', _onWssClose);
        resolve(null);
      });
    });
  }

  async stop() {
    const { _logger, _httpServer } = this;
    _logger.info('HttpAndWsService.stop()...');
    await new Promise((resolve, _reject) => {
      _httpServer.close(() => {
        _logger.info('HttpAndWsService.stop()... done!');
        resolve(null);
      });
    });
  }
}
