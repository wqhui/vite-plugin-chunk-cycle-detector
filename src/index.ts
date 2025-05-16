import { Plugin } from 'vite'
import {console, getCycleNodesWithKahnAlgorithm} from './utils'


/**
 * 在给定的子图中，提取所有“简单环”（simple cycles）。
 * 使用深度优先搜索（DFS）探测并返回所有从某节点出发，最终回到自身的路径。
 * @param cycleNodes   剩余的“环中”节点列表（如通过 Kahn 算法剥离后得到）
 * @param adjacency    邻接表，Map<节点ID, Set<相邻节点ID>>，表示有向图
 * @returns            简单环路径列表，每条路径以数组形式返回，且首尾节点一致
 */
function extractPathsInCycles(cycleNodes: string[], adjacency: Map<string, Set<string>>): string[][] {
  // 存储所有检测到的环路径
  const cyclePaths: string[][] = []

  // 全局标记，避免对同一节点重复启动 DFS
  const globallyVisited = new Set<string>()

  /**
   * 递归 DFS 辅助，用来跟踪路径并探测“回边”形成的环。
   *
   * @param current    当前访问节点
   * @param pathStack  当前递归路径栈
   * @param inStack    当前栈节点集合，用于快速检测“回边”
   */
  function dfs(current: string, pathStack: string[], inStack: Set<string>) {
    // 如果再次遇到栈中的节点，则找到了一个环
    if (inStack.has(current)) {
      const loopStartIndex = pathStack.indexOf(current)
      // 只截取当前环的部分，并在末尾补上起点，形成闭环
      cyclePaths.push(pathStack.slice(loopStartIndex).concat(current))
      return
    }

    // 如果该节点已被全局访问过，无需再次搜索
    if (globallyVisited.has(current)) {
      return
    }

    // 标记并加入路径
    globallyVisited.add(current)
    pathStack.push(current)
    inStack.add(current)

    // 继续往所有邻居深度搜索
    adjacency.get(current)?.forEach((neighbor) => {
      // 仅对原“环节点”集合中的节点进行 DFS
      if (cycleNodes.includes(neighbor)) {
        dfs(neighbor, pathStack, inStack)
      }
    })

    // 回溯：出栈并移除标记
    pathStack.pop()
    inStack.delete(current)
  }

  // 对每一个环节点启动一次 DFS，提取所有简单环
  cycleNodes.forEach((node) => {
    if (!globallyVisited.has(node)) {
      dfs(node, [], new Set<string>())
    }
  })

  return cyclePaths
}

/**
 * Vite 插件：检测 chunk 之间的循环依赖，并输出详细的依赖路径。
 * @param options - 插件配置选项
 *   - circleImportThrowError: 是否在检测到循环依赖时抛出错误
 *   - showCircleImportModuleDetail: 是否显示循环依赖的模块详细信息
 * @returns Vite 插件对象
 */
export default function chunkCycleDetectorPlugin(options?: {
  circleImportThrowError?: boolean
  showCircleImportModuleDetail?: boolean
}): Plugin {
  return {
    name: 'vite-plugin-chunk-cycle-detector',
    async generateBundle(_, bundle) {
      const { circleImportThrowError = false, showCircleImportModuleDetail = false } = options || {}
      const getModuleInfo = this.getModuleInfo?.bind(this)
      const moduleIdToChunkIdMap = new Map<string, string>()
      const chunkIdSet = new Set<string>()

      // 构建模块到 chunk 的映射关系
      for (const [chunkId, outputChunk] of Object.entries(bundle)) {
        if (outputChunk.type !== 'chunk') continue
        chunkIdSet.add(chunkId)
        Object.keys(outputChunk.modules).forEach((moduleId) => {
          moduleIdToChunkIdMap.set(moduleId, chunkId)
        })
      }

      // 构建模块级别的依赖边列表
      const moduleDependencyEdges: DependencyEdge[] = []
      moduleIdToChunkIdMap.forEach((chunkId, moduleId) => {
        const moduleInfo = getModuleInfo?.(moduleId)
        if (!moduleInfo) return
        moduleInfo.importedIds.forEach((importedModuleId) => {
          const importedChunkId = moduleIdToChunkIdMap.get(importedModuleId)
          if (!importedChunkId || importedChunkId === chunkId) return
          moduleDependencyEdges.push([moduleId, importedModuleId])
        })
      })

      // 根据模块的依赖边列表，构建 chunk级别的依赖关系 和 模块依赖映射
      const chunkDependencyEdges: DependencyEdge[] = [] // [fromChunkId, toChunkId][]
      const chunkDependencyMap = new Map<string, Set<string>>() // fromChunkId -> Set<toChunkId>
      const chunkModuleDependencyMap = new Map<string, Map<string, DependencyEdge[]>>() // chunkId -> (toChunkId -> [fromModuleId, toModuleId][])

      moduleDependencyEdges.forEach(([fromModuleId, toModuleId]) => {
        const fromChunkId = moduleIdToChunkIdMap.get(fromModuleId)!
        const toChunkId = moduleIdToChunkIdMap.get(toModuleId)!

        // 构建 chunk 之间的依赖关系
        if (!chunkDependencyMap.has(fromChunkId)) {
          chunkDependencyMap.set(fromChunkId, new Set())
        }
        chunkDependencyMap.get(fromChunkId)!.add(toChunkId)
        chunkDependencyEdges.push([fromChunkId, toChunkId])

        // 构建模块依赖映射
        if (!chunkModuleDependencyMap.has(fromChunkId)) {
          chunkModuleDependencyMap.set(fromChunkId, new Map())
        }
        const innerMap = chunkModuleDependencyMap.get(fromChunkId)!
        if (!innerMap.has(toChunkId)) {
          innerMap.set(toChunkId, [])
        }
        innerMap.get(toChunkId)!.push([fromModuleId, toModuleId])
      })

      // 使用 Kahn 算法检测循环依赖
      const allChunkIds = Array.from(chunkIdSet)
      const [cycledNodes, adjacencyMap] = getCycleNodesWithKahnAlgorithm(allChunkIds, chunkDependencyEdges)

      if (cycledNodes.length === 0) return
      const cyclePaths = extractPathsInCycles(cycledNodes, adjacencyMap)
      if (cyclePaths.length === 0) return
      // 输出检测到的循环依赖信息
      console.log('\n\r')
      console.error(`⚠️ 检测到 ${cyclePaths.length} 个 chunk 间的循环依赖：\n`)
      cyclePaths.forEach((paths, index) => {
        console.warn(`  🔄 循环${index + 1}: ${paths.join(' → ')}`)
        if (showCircleImportModuleDetail) {
          for (let i = 0; i < paths.length; i++) {
            const fromChunkId = paths[i]
            const toChunkId = paths[(i + 1) % paths.length]
            const moduleEdges = chunkModuleDependencyMap.get(fromChunkId)?.get(toChunkId) || []
            if (moduleEdges.length > 0) {
              const [fromModuleId, toModuleId] = moduleEdges[0] // 只取第一条边
              console.log(`     ${fromChunkId} 中的模块 ${fromModuleId} 引用了 ${toChunkId} 中的模块 ${toModuleId}`)
            }
          }
        }
        console.log('\n\r')
      })

      // 根据配置决定是否抛出错误以中断构建
      if (circleImportThrowError) {
        throw new Error('检测到 chunk 间的循环依赖')
      }
    },
  }
}
