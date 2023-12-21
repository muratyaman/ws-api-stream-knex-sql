import { randomUUID as uuid } from 'node:crypto';
import { pack, unpack } from 'msgpackr';
import WebSocket from 'ws';

const log = (msg, ...args) => console.log.apply(console, [new Date(), msg, JSON.stringify(args, null, 2)]);

const payloadAdapter = { encode: pack, decode: unpack };

const ws = new WebSocket('ws://127.0.0.1:8080/');
const messenger = newMessenger();

ws.on('error', (err) => log('ws error', err));
ws.on('open', onWsOpen); // starts sending messages
ws.on('message', onWsMessage); // processes incoming messages
ws.on('close', onWsClose); // processes incoming messages

let sent = 0, received = 0;

function onWsOpen() {
  log('onWsOpen: opened');

  test_echo('hello');
  test_echo('world');

  test_selectUser({ criteria: { id: 1 }});
  test_selectUser({ criteria: { id: { $eq: 2 }}, columns: ['email_address', 'name']});
  test_selectUser({ criteria: { id: { $neq: 2 }}});
  test_selectUser({ criteria: { id: { $gt: 10 }}});
  test_selectUser({ criteria: { id: { $gte: 100 }}});

  test_selectUsers({ criteria: { id: { $lt: 10 }}, limit: 2, offset: 0 });
  test_selectUsers({ criteria: { id: { $lte: 100 }}, limit: 5, offset: 100 });
  test_selectUsers({ criteria: { id: { $in: [10, 20, 30] }}, limit: 2, offset: 0 });
  test_selectUsers({ criteria: { id: { $nin: [10, 20, 30] }}, limit: 2, offset: 0 });
}

function onWsClose() {
  log('onWsClose: closed');
}

function wsSend(payloadObj) {
  sent++;
  log('wsSend: sending', payloadObj);
  ws.send(payloadAdapter.encode(payloadObj));
}

function onWsMessage(payload) {
  received++;
  const payloadObj = payloadAdapter.decode(payload);
  log('onWsMessage: received obj', payloadObj);
  messenger.handleResponse(payloadObj);
}

function test_echo(msg = 'hello') {
  const ts = new Date(), id = uuid();
  const input = {
    meta: { kind: 'echo', id, ts },
    data: { msg },
  };
  messenger.addMsgHandler(input,  {
    onData: (response) => {
      // expectation: for correlation id === response.meta.id
      log('test_echo: received data', id, response);
      messenger.addEcho(response);
    },
  });
  wsSend(input);
}

function test_selectUser({ criteria = {}, columns = '*' }) {
  const ts = new Date(), id = uuid();
  const input = {
    meta: { kind: 'select_user', id, ts },
    data: { criteria, columns },
  };
  messenger.addMsgHandler(input, {
    onData: (response) => {
      // expectation: for correlation id === response.meta.id
      log('test_selectUser: received data', id, response);
      messenger.addUser(response);
    },
  });
  wsSend(input);
}

function test_selectUsers({ criteria = {}, columns = ['id', 'email_address', 'name'], limit = 10, offset = 0 }) {
  const ts = new Date(), id = uuid();
  const input = {
    meta: { kind: 'select_users', id, ts },
    data: { limit, offset, criteria, columns },
  };
  messenger.addMsgHandler(input, {
    onData: (response) => {
      // expectation: for correlation id === response.meta.id
      log('test_selectUsers: received data', id, response);
      if (response.data) messenger.addUser(response);
    },
    onError: ({ error }) => {
      log('test_selectUsers: received error', id, error);
    },
    onLast: () => {
      log('test_selectUsers: received last', id);
    },
    autoRemove: true,
  });
  wsSend(input);
}

function newMessenger() {

  const db = {
    echoList: [],
    usersById: {},
  };
  const msgHandlers = new Map();

  function checkExit() {
    log('checkExit: msgHandlers.size', msgHandlers.size, { sent, received });
    msgHandlers.size === 0 && process.exit(0);
  }

  function handlerKey(payloadObjOrKey) {
    if (typeof payloadObjOrKey === 'string') {
      return payloadObjOrKey;
    }
    const { meta = {}} = payloadObjOrKey;
    const { kind, id } = meta || {};
    return `${kind}/${id}`;
  }

  function addMsgHandler(payloadObj, { onData = noOp, onError = noOp, onLast = noOp, autoRemove = true }) {
    msgHandlers.set(handlerKey(payloadObj), { onData, onError, onLast, autoRemove });
  }
  function delMsgHandler(payloadObj) {
    const key = handlerKey(payloadObj);
    if (msgHandlers.has(key)) msgHandlers.delete(key);
  }

  function addEcho({ data }) {
    if (!data) return;
    db.echoList.push(data);
  }

  function addUser({ data }) {
    if (!data) return;
    const { id } = data || {};
    if (!id) return;
    db.usersById[id] = data;
  }

  async function handleResponse(payloadObj) {
    const { data, last, error } = payloadObj;
    const key = handlerKey(payloadObj);
    if (!msgHandlers.has(key)) {
      log('handleResponse: no handler', key);
      return;
    }
    const { onData = noOp, onError = noOp, onLast = noOp, autoRemove = true } = msgHandlers.get(key);
    if (data) {
      await onData(payloadObj);
    }
    if (error) {
      await onError(payloadObj);
    }
    if (last) {
      await onLast(payloadObj);
      if (autoRemove) delMsgHandler(key);
    }

    checkExit(); // after last handler
  }

  return {
    db,
    msgHandlers,
    addMsgHandler,
    delMsgHandler,
    addEcho,
    addUser,
    handleResponse,
  };
}

function noOp() {}
