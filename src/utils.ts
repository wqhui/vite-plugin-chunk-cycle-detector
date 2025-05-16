/**
 * 使用 Kahn 算法检测有向图中的所有循环路径。
 * @param nodes - 图中的所有节点（chunk ID）
 * @param edges - 有向边列表，格式为 [from, to]
 * @returns 检测到的循环的节点 ID 数组 和 邻接表
 */
function getCycleNodesWithKahnAlgorithm(
  nodes: NodeId[],
  edges: DependencyEdge[],
): [NodeId[], Map<NodeId, Set<NodeId>>] {
  // 初始化每个节点的入度和邻接表
  const inDegreeMap = new Map<NodeId, number>() // 对于图中的每个节点，统计其入度（即有多少条边指向该节点) , sum(inDegree) -> node(id)
  const adjacencyMap = new Map<NodeId, Set<NodeId>>() // 对于图中的每个节点，存储其所有的邻接节点（即该节点指向的其他节点）, node(id) -> Set<neighbor>

  nodes.forEach((node) => {
    inDegreeMap.set(node, 0)
    adjacencyMap.set(node, new Set())
  })

  // 构建图的结构：计算入度和邻接关系
  edges.forEach(([from, to]) => {
    // 可能存在重复的from -> to
    if (adjacencyMap.get(from)!.has(to)) return // 忽略重复的边
    if (from === to) return // 忽略自循环
    adjacencyMap.get(from)!.add(to)
    inDegreeMap.set(to, (inDegreeMap.get(to) ?? 0) + 1)
  })

  // 初始化队列，加入所有入度为 0 的节点
  const queue: string[] = []
  inDegreeMap.forEach((inDegree, node) => {
    if (inDegree === 0) queue.push(node)
  })

  // 拓扑排序：移除无环节点
  const visited = new Set<string>()
  while (queue.length > 0) {
    // 从队列中取出入度为 0 的节点，将其标记为已访问
    const current = queue.shift()!
    visited.add(current)

    // 遍历当前节点的所有邻接节点，将其入度减 1，如果节点的入度为 0 的节点加入待处理队列
    adjacencyMap.get(current)!.forEach((neighbor) => {
      inDegreeMap.set(neighbor, inDegreeMap.get(neighbor)! - 1)
      if (inDegreeMap.get(neighbor) === 0) {
        queue.push(neighbor)
      }
    })
  }

  if (visited.size === nodes.length) {
    // 如果所有节点都被访问过，说明图中不存在环
    return [[], adjacencyMap]
  }

  return [nodes.filter((node) => !visited.has(node)), adjacencyMap]
}

// 定义颜色常量，提高代码可读性和可维护性
const YELLOW_COLOR_CODE = '\x1B[33m'
const RED_COLOR_CODE = '\x1B[31m'
const RESET_COLOR_CODE = '\x1B[0m'

// 保存原始的 console 对象
const originConsole = console

// 封装一个通用的带颜色输出的函数
const coloredLog = (logMethod: (...args: any[]) => void, colorCode: string, ...args: any[]) => {
  logMethod(`${colorCode}%s${RESET_COLOR_CODE}`, ...args)
}

// 创建自定义的 console 对象
const myConsole = {
  // 保留原始 console 对象的其他方法
  ...originConsole,
  warn: (...args: Parameters<Console['warn']>) => coloredLog(originConsole.warn, YELLOW_COLOR_CODE, ...args),
  error: (...args: Parameters<Console['error']>) => coloredLog(originConsole.error, RED_COLOR_CODE, ...args),
}

export {
  getCycleNodesWithKahnAlgorithm,
  myConsole as console,
}
