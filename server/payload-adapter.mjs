import { pack, unpack } from 'msgpackr';

export class PayloadAdapter {

  encode(payloadObj) {
    return pack(payloadObj);
  }

  decode(payloadBuffer) {
    return unpack(payloadBuffer);
  }
}
