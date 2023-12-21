export class BasicService {
  name = 'BasicService';
  async start() {
    throw new Error(this.name + '.start() not implemented');
  }
  async stop() {
    throw new Error(this.name + '.stop() not implemented');
  }
}
