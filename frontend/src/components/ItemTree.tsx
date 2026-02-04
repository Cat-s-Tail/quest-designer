import { useCallback, useMemo, useState, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'

const dagreGraph = new dagre.graphlib.Graph({ compound: true })
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 200
const nodeHeight = 120

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node: any) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge: any) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node: any) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

export default function ItemTree({ items, selectedItem, onSelectItem, onAddItem, onRelink, onUpdatePosition, onGetAllPositions }: any) {
  const [itemsVersion, setItemsVersion] = useState(0)

  // Build nodes from items
  const initialNodes = useMemo(() => {
    return items.map((item: any) => {
      const isSelected = selectedItem === item.id
      const actionCount = item.actions?.length || 0
      
      return {
        id: item.id,
        position: item.position || { x: 0, y: 0 },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-bold text-sm mb-1">{item.name}</div>
              <div className="text-xs text-slate-300">{item.type || 'generic'}</div>
              <div className="text-xs text-slate-400 mt-1">
                {item.stackable ? `Stack: ${item.maxStack}` : 'Non-stackable'}
              </div>
              <div className="text-xs text-slate-400">
                {actionCount} action{actionCount !== 1 ? 's' : ''}
              </div>
            </div>
          ),
        },
        style: {
          background: isSelected ? '#16a34a' : '#334155',
          color: '#fff',
          border: isSelected ? '3px solid #4ade80' : '2px solid #64748b',
          borderRadius: '8px',
          padding: '4px',
          cursor: 'pointer',
          minWidth: '180px',
        },
      }
    })
  }, [items, selectedItem])

  // Build edges from next
  const initialEdges = useMemo(() => {
    const edges: any[] = []
    items.forEach((item: any) => {
      if (item.next && Array.isArray(item.next)) {
        item.next.forEach((nextId: string) => {
          edges.push({
            id: `${item.id}->${nextId}`,
            source: item.id,
            target: nextId,
            animated: true,
            style: { stroke: '#4ade80', strokeWidth: 2 },
            label: 'next',
            labelStyle: { fill: '#fff', fontSize: 11, fontWeight: 'bold' },
            labelBgStyle: { fill: '#166534', fillOpacity: 0.8 },
            labelBgPadding: [4, 4],
            labelBgBorderRadius: 4,
          })
        })
      }
    })
    return edges
  }, [items])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const nodesNeedingLayout = initialNodes.filter((n: any) => !n.position || (n.position.x === 0 && n.position.y === 0))
    const nodesWithPosition = initialNodes.filter((n: any) => n.position && !(n.position.x === 0 && n.position.y === 0))
    
    if (nodesNeedingLayout.length > 0) {
      const layouted = getLayoutedElements(nodesNeedingLayout, initialEdges, 'TB')
      return { 
        nodes: [...nodesWithPosition, ...layouted.nodes], 
        edges: initialEdges 
      }
    }
    
    return { nodes: initialNodes, edges: initialEdges }
  }, [initialNodes, initialEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // 暴露获取所有节点位置的函数
  useEffect(() => {
    if (onGetAllPositions) {
      const getPositions = () => {
        const positions = new Map<string, { x: number; y: number }>()
        nodes.forEach(node => {
          positions.set(node.id, node.position)
        })
        return positions
      }
      onGetAllPositions(getPositions)
    }
  }, [nodes, onGetAllPositions])

  useEffect(() => {
    setItemsVersion(prev => prev + 1)
  }, [items.length])

  useEffect(() => {
    setNodes(prevNodes => {
      const newNodesMap = new Map(layoutedNodes.map((n: any) => [n.id, n]))
      const existing = prevNodes.filter(pn => newNodesMap.has(pn.id)).map(prevNode => {
        const newNode = newNodesMap.get(prevNode.id) as any
        const shouldUseNewPosition = newNode?.position && !(newNode.position.x === 0 && newNode.position.y === 0)
        return { 
          ...newNode, 
          position: shouldUseNewPosition ? newNode.position : prevNode.position 
        }
      })
      const newOnes = layoutedNodes.filter((n: any) => !prevNodes.find(pn => pn.id === n.id))
      return [...existing, ...newOnes]
    })
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges, itemsVersion])

  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#4ade80', strokeWidth: 2 } }, eds))
      if (onRelink) {
        onRelink(params.source, params.target)
      }
    },
    [setEdges, onRelink]
  )

  const onNodeClick = useCallback(
    (_: any, node: any) => {
      if (onSelectItem) {
        onSelectItem(node.id)
      }
    },
    [onSelectItem]
  )

  const onNodeDragStop = useCallback(
    (_: any, node: any) => {
      if (onUpdatePosition) {
        onUpdatePosition(node.id, node.position)
      }
    },
    [onUpdatePosition]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
