export interface RedisPoolConf {
  host?: string;
  port?: number;
  db?: number;
  password?: string;
  keyPrefix?: string;

  max?: number;
  min?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
}
