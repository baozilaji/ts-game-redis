import { RedisPool } from './pool';
import { Configuration } from 'ts-game-environment';
import { RedisPoolConf } from './types';

const KEY_REDIS = 'redis';
const KEY_REDIS_DEFAULT_SERVER = 'default';

class _RedisManager {
  private static _instance: _RedisManager | null;
  private _pools: Record<string, RedisPool> = {};
  private constructor() {
    let redis_cfg = Configuration.getConf(KEY_REDIS);
    if (!redis_cfg || typeof redis_cfg !== 'object') return;

    Object.keys(redis_cfg).forEach((svr) => {
      let cfg = Reflect.get(redis_cfg, svr) as RedisPoolConf;
      this._pools[svr] = new RedisPool(cfg);
    });
  }

  static get instance() {
    if (!_RedisManager._instance) _RedisManager._instance = new _RedisManager();
    return _RedisManager._instance;
  }

  getRedisPool(server_name: string = KEY_REDIS_DEFAULT_SERVER): RedisPool {
    if (this._pools[server_name]) {
      return this._pools[server_name];
    } else {
      throw Error(`Can't find redis config for ${server_name}`);
    }
  }
}

export const RedisManager: _RedisManager = _RedisManager.instance;
