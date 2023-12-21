const TRUTHY = ['true', 'yes', 'on', '1'];

export class Env {
  constructor(penv, keyPrefix = '') {
    this.keyPrefix = keyPrefix;
    this.penv = this.filter(penv, keyPrefix);
  }

  filter(penv, keyPrefix = '') {
    if (!keyPrefix) return penv;
    const result = {};
    Object.entries(penv)
      .filter(([key]) => key.startsWith(keyPrefix))
      .forEach(([key, value]) => {
        result[key] = value;
      });
    return result;
  }

  newEnv(keyPrefix) {
    return new Env(this.penv, `${this.keyPrefix}${keyPrefix}`);
  }

  str(key, def = '') {
    const fullKey = `${this.keyPrefix}${key}`;
    return this.penv[fullKey] || def;
  }

  int(key, def = 0) {
    let s = this.str(key, String(def));
    const i = Number.parseInt(s, 10);
    return Number.isNaN(i) ? def : i;
  }

  float(key, def = 0.0) {
    let s = this.str(key, String(def));
    const f = Number.parseFloat(s);
    return Number.isNaN(f) ? def : f;
  }

  bool(key, def = false) {
    let s = this.str(key, String(def)).toLowerCase();
    return TRUTHY.includes(s) ? true : Boolean(def);
  }

}
