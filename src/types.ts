type NodeId = string
/**
 * 表示模块之间的依赖关系边。
 * @typedef {[string, string]} DependencyEdge
 *   - from: 源模块 ID
 *   - to: 目标模块 ID
 */
type DependencyEdge = [from: NodeId, to: NodeId]

