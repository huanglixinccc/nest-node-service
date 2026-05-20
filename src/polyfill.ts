/**
 * Node 18 下 @nestjs/typeorm 依赖 globalThis.crypto，
 * 启动前注入 webcrypto 以避免运行时报错。
 */
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}
