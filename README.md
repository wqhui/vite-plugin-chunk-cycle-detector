# vite-plugin-chunk-cycle-detector

Vite插件，用于检测构建产物中chunk之间的循环依赖，并输出详细的依赖路径信息。

## 功能特性
- 精准检测chunk级循环依赖：基于Kahn算法识别循环依赖的chunk集合
- 详细路径展示：通过DFS提取所有简单环路径，直观展示循环链路
- 可配置错误抛出：支持在检测到循环时中断构建（通过`circleImportThrowError`配置）
- 模块级依赖详情：可选展示具体模块间的引用关系（通过`showCircleImportModuleDetail`配置）

## 安装
```bash
# npm
npm install vite-plugin-chunk-cycle-detector -D

# pnpm
pnpm add vite-plugin-chunk-cycle-detector -D

# yarn
yarn add vite-plugin-chunk-cycle-detector -D
```

## 使用示例
在`vite.config.ts`中配置插件：

```typescript
import { defineConfig } from 'vite'
import chunkCycleDetectorPlugin from 'vite-plugin-chunk-cycle-detector'

export default defineConfig({ 
  plugins: [
    chunkCycleDetectorPlugin({ 
      circleImportThrowError: true, // 检测到循环时抛出错误中断构建
      showCircleImportModuleDetail: true // 显示具体模块间的依赖关系
    })
  ]
}) 
```

## 配置选项
| 选项名                      | 类型      | 默认值  | 说明                                                                 |
|---------------------------|-----------|---------|--------------------------------------------------------------------|
| circleImportThrowError    | boolean   | false   | 是否在检测到循环依赖时抛出错误（会中断构建流程）                                      |
| showCircleImportModuleDetail | boolean  | false   | 是否显示循环路径中具体模块间的引用关系（如`chunkA中的module1引用了chunkB中的module2`） |

## 输出示例
```
⚠️ 检测到 2 个 chunk 间的循环依赖：

  🔄 循环1: chunkA → chunkB → chunkA
     chunkA 中的模块 src/a.js 引用了 chunkB 中的模块 src/b.js
     chunkB 中的模块 src/b.js 引用了 chunkA 中的模块 src/a.js

  🔄 循环2: chunkC → chunkD → chunkC
     chunkC 中的模块 src/c.js 引用了 chunkD 中的模块 src/d.js
     chunkD 中的模块 src/d.js 引用了 chunkC 中的模块 src/c.js
```

## 许可证
MIT