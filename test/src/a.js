// a.js 与 b.js 形成循环依赖
import { bFunc } from './b.js';

export function aFunc() {
  return `aFunc called, bFunc result: ${bFunc()}`;
}