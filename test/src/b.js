// b.js 与 a.js 形成循环依赖
import { aFunc } from './a.js';

export function bFunc() {
  return `bFunc called, aFunc result: ${aFunc()}`;
}