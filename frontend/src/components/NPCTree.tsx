import { useCallback, useMemo, useEffect, useState } from 'react'
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

const nodeWidth = 180
const nodeHeight = 80

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

const getNodeColor = (type: string) => {
  switch (type) {
    case 'option': return '#9333ea' // purple
    case 'dialog': return '#3b82f6' // blue
    case 'instruction': return '#f97316' // orange
    case 'exit': return '#6b7280' // gray
    default: return '#475569'
  }
}

export default function NPCTree({ npc, selectedNode, onSelectNode, onAddNode, onRelink, onBreakLink, onUpdatePosition }: any) {
  const [npcId, setNpcId] = useState(npc?.id)

  const initialElements = useMemo(() => {
    if (!npc) return { nodes: [] as any[], edges: [] as any[] }

    const reactFlowNodes: any[] = []
    const reactFlowEdges: any[] = []

    // Root NPC node (always at origin, not saved)
    reactFlowNodes.push({
      id: `${npc.id}-root`,
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div className="text-center">
            <div className="font-bold text-sm">{npc.name}</div>
            <div className="text-xs text-slate-300">NPC Root</div>
          </div>
        ),
      },
      style: {
        background: '#1e40af',
        color: '#fff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '10px',
        fontWeight: 'bold',
      },
    })

    // Create edges from root to entryNodes
    ;(npc.entryNodes || []).forEach((nodeId: string) => {
      if (nodeId) {
        reactFlowEdges.push({
          id: `root->${nodeId}`,
          source: `${npc.id}-root`,
          target: nodeId,
          animated: true,
          style: { stroke: '#60a5fa', strokeWidth: 2 },
        })
      }
    })

    // Create nodes from flat node list
    ;(npc.nodes || []).forEach((node: any) => {
      const isSelected = selectedNode === node.id
      
      reactFlowNodes.push({
        id: node.id,
        // Use saved position if available
        position: node.position || { x: 0, y: 0 },
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-xs">{node.type}</div>
              <div className="text-xs text-slate-200 truncate" style={{ maxWidth: '150px' }}>
                {node.text?.substring(0, 20) || node.code?.substring(0, 20) || node.id.substring(0, 8)}
              </div>
              {node.next?.length > 0 && (
                <div className="text-xs text-slate-300">→ {node.next.length}</div>
              )}
            </div>
          ),
        },
        style: {
          background: getNodeColor(node.type),
          color: '#fff',
          border: isSelected ? '3px solid #fbbf24' : '2px solid #1e293b',
          borderRadius: '8px',
          padding: '8px',
          fontSize: '12px',
          cursor: 'pointer',
        },
      })

      // Create edges from node.next array
      if (node.next && Array.isArray(node.next)) {
        node.next.forEach((nextId: string, index: number) => {
          if (nextId) {
            reactFlowEdges.push({
              id: `${node.id}->${nextId}-${index}`,
              source: node.id,
              target: nextId,
              animated: false,
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              label: node.next.length > 1 ? `${index + 1}` : '',
              labelStyle: { fill: '#fff', fontSize: 10 },
              labelBgStyle: { fill: '#334155' },
            })
          }
        })
      }
    })

    return { nodes: reactFlowNodes, edges: reactFlowEdges }
  }, [npc, selectedNode])

  const layoutedElements = useMemo(() => {
    // Only auto-layout nodes that don't have saved positions (excluding root which always has position)
    const nodesNeedingLayout = initialElements.nodes.filter(
      (n: any) => n.id !== `${npc?.id}-root` && (!n.position || (n.position.x === 0 && n.position.y === 0))
    )
    const nodesWithPosition = initialElements.nodes.filter(
      (n: any) => n.id === `${npc?.id}-root` || (n.position && !(n.position.x === 0 && n.position.y === 0))
    )
    
    if (nodesNeedingLayout.length > 0) {
      const layouted = getLayoutedElements(nodesNeedingLayout, initialElements.edges, 'TB')
      // Offset layouted nodes to avoid overlap with positioned ones
      const offsetLayouted = layouted.nodes.map((n: any) => ({
        ...n,
        position: { x: n.position.x + 400, y: n.position.y + 200 }
      }))
      return { 
        nodes: [...nodesWithPosition, ...offsetLayouted], 
        edges: initialElements.edges 
      }
    }
    
    return { nodes: initialElements.nodes, edges: initialElements.edges }
  }, [initialElements, npc])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedElements.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedElements.edges)

  // Only re-layout when switching NPCs, otherwise preserve positions
  useEffect(() => {
    if (npc?.id !== npcId) {
      // New NPC selected, apply full layout
      setNodes(layoutedElements.nodes)
      setEdges(layoutedElements.edges)
      setNpcId(npc?.id)
    } else {
      // Same NPC, update data but preserve positions (user may have dragged nodes)
      setNodes(prevNodes => {
        const newNodesMap = new Map(layoutedElements.nodes.map((n: any) => [n.id, n]))
        const existing = prevNodes.filter(pn => newNodesMap.has(pn.id)).map(prevNode => {
          const newNode = newNodesMap.get(prevNode.id)
          return { ...newNode, position: prevNode.position }
        })
        const newOnes = layoutedElements.nodes.filter(n => !prevNodes.find(pn => pn.id === n.id))
        return [...existing, ...newOnes]
      })
      setEdges(layoutedElements.edges)
    }
  }, [layoutedElements, npc?.id, npcId, setNodes, setEdges])

  // Listen for focus events from search
  useEffect(() => {
    const handleFocusNode = (e: any) => {
      const { nodeId } = e.detail
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        onSelectNode(nodeId)
        // Center on this node - simulate fitView
        window.dispatchEvent(new CustomEvent('reactflow-fit-view', { 
          detail: { nodes: [node], duration: 500 } 
        }))
      }
    }
    window.addEventListener('focusNode', handleFocusNode)
    return () => window.removeEventListener('focusNode', handleFocusNode)
  }, [nodes, onSelectNode])

  // Save positions when nodes are dragged
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    
    // Save positions on drag end (skip root node)
    changes.forEach((change: any) => {
      if (change.type === 'position' && 
          change.dragging === false && 
          change.position && 
          !change.id.endsWith('-root')) {
        if (onUpdatePosition) {
          onUpdatePosition(change.id, change.position)
        }
      }
    })
  }, [onNodesChange, onUpdatePosition])

  const handleNodeClick = useCallback((_event: any, node: any) => {
    if (node.id.endsWith('-root')) {
      onSelectNode(null) // Select NPC root
    } else {
      onSelectNode(node.id)
    }
  }, [onSelectNode])

  const handleConnect = useCallback((connection: any) => {
    if (onRelink && connection.source && connection.target) {
      // Don't connect root nodes
      if (!connection.source.endsWith('-root')) {
        onRelink(connection.source, connection.target)
      }
    }
    setEdges((eds) => addEdge({ ...connection, animated: false, style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds))
  }, [setEdges, onRelink])

  const handleEdgeClick = useCallback((event: any, edge: any) => {
    if ((event.ctrlKey || event.metaKey) && onBreakLink) {
      const sourceId = edge.source.replace(`${npc?.id}-root`, '')
      const targetId = edge.target
      
      onBreakLink(sourceId || edge.source, targetId)
      
      // Remove edge from UI
      setEdges((eds) => eds.filter(e => e.id !== edge.id))
    }
  }, [onBreakLink, npc, setEdges])

  if (!npc) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-slate-400">
        Select an NPC to view dialog tree
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-slate-800 p-2 border-b border-slate-700 flex gap-2">
        <button
          onClick={() => onAddNode('option')}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-sm rounded"
        >
          + Option
        </button>
        <button
          onClick={() => onAddNode('dialog')}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded"
        >
          + Dialog
        </button>
        <button
          onClick={() => onAddNode('instruction')}
          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-sm rounded"
        >
          + Instruction
        </button>
        <button
          onClick={() => onAddNode('exit')}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-sm rounded"
        >
          + Exit
        </button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onConnect={handleConnect}
          fitView
        >
          <Background color="#334155" />
          <Controls />
        </ReactFlow>
      </div>
      <div className="bg-slate-800 p-2 border-t border-slate-700 text-xs text-slate-400">
        Tip: Drag from node handle to create connections. Ctrl+Click edge to delete.
      </div>
    </div>
  )
}
