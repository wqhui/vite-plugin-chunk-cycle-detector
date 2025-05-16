import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from "rollup-plugin-terser"

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs', // CommonJS格式
    },
    {
      file: 'dist/index.mjs',
      format: 'esm', // ES模块格式
    },
    {
      file: "dist/index.umd.js",
      name: "ChunkCycleDetector",
      format: "umd",
    },
  ],
  plugins: [
    nodeResolve(), // 解析Node.js模块
    commonjs(), // 转换CommonJS模块为ES模块
    typescript({ tsconfig: './tsconfig.json' }), // 使用tsconfig配置
    terser(),
  ],
  external: ['vite'] // 排除peer依赖（如vite）
};