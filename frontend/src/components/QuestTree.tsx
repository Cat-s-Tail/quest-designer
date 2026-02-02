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
const nodeHeight = 100

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

export default function QuestTree({ quests, selectedQuest, onSelectQuest, onAddQuest, onRelink, onUpdatePosition }: any) {
  const [questsVersion, setQuestsVersion] = useState(0)

  // Build nodes from missions/quests
  const initialNodes = useMemo(() => {
    return quests.map((quest: any) => {
      const isSelected = selectedQuest === quest.id
      const objectiveCount = quest.conditions?.and?.length || quest.objectives?.length || 0
      
      return {
        id: quest.id,
        // Use saved position if available
        position: quest.position || { x: 0, y: 0 },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-bold text-sm mb-1">{quest.name || quest.title}</div>
              <div className="text-xs text-slate-300">{quest.category || 'general'}</div>
              <div className="text-xs text-slate-400 mt-1">
                {objectiveCount} objective{objectiveCount !== 1 ? 's' : ''}
              </div>
            </div>
          ),
        },
        style: {
          background: isSelected ? '#2563eb' : '#334155',
          color: '#fff',
          border: isSelected ? '3px solid #60a5fa' : '2px solid #64748b',
          borderRadius: '8px',
          padding: '4px',
          cursor: 'pointer',
          minWidth: '180px',
        },
      }
    })
  }, [quests, selectedQuest])

  // Build edges from next
  const initialEdges = useMemo(() => {
    const edges: any[] = []
    quests.forEach((quest: any) => {
      if (quest.next && Array.isArray(quest.next)) {
        quest.next.forEach((nextId: string) => {
          edges.push({
            id: `${quest.id}->${nextId}`,
            source: quest.id,
            target: nextId,
            animated: true,
            style: { stroke: '#60a5fa', strokeWidth: 2 },
            label: 'next',
            labelStyle: { fill: '#fff', fontSize: 11, fontWeight: 'bold' },
            labelBgStyle: { fill: '#1e3a8a', fillOpacity: 0.8 },
            labelBgPadding: [4, 4],
            labelBgBorderRadius: 4,
          })
        })
      }
    })
    return edges
  }, [quests])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    // Only auto-layout nodes that don't have saved positions
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

  // Track quest count to detect additions/deletions
  useEffect(() => {
    setQuestsVersion(prev => prev + 1)
  }, [quests.length])

  // Update nodes and edges when quests change, preserving positions for existing nodes
  useEffect(() => {
    setNodes(prevNodes => {
      const newNodesMap = new Map(layoutedNodes.map((n: any) => [n.id, n]))
      // Keep existing nodes, but prioritize saved positions from data
      const existing = prevNodes.filter(pn => newNodesMap.has(pn.id)).map(prevNode => {
        const newNode = newNodesMap.get(prevNode.id) as any
        // Only preserve prevNode position if newNode doesn't have a saved position
        // This allows data from backend (with saved positions) to take precedence
        const shouldUseNewPosition = newNode?.position && !(newNode.position.x === 0 && newNode.position.y === 0)
        return { 
          ...newNode, 
          position: shouldUseNewPosition ? newNode.position : prevNode.position 
        }
      })
      // Add new nodes with layout positions
      const newOnes = layoutedNodes.filter((n: any) => !prevNodes.find(pn => pn.id === n.id))
      return [...existing, ...newOnes]
    })
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges, questsVersion])

  // Listen for focus events from search
  useEffect(() => {
    const handleFocusMission = (e: any) => {
      const { missionId } = e.detail
      const node = nodes.find(n => n.id === missionId)
      if (node) {
        // Center on this node
        window.dispatchEvent(new CustomEvent('reactflow-fit-view', { 
          detail: { nodes: [node], duration: 500 } 
        }))
      }
    }
    window.addEventListener('focusMission', handleFocusMission)
    return () => window.removeEventListener('focusMission', handleFocusMission)
  }, [nodes])

  // Save positions when nodes are dragged
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    
    // Save positions on drag end
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.dragging === false) {
        // Get the actual node from the nodes array to get its current position
        // change.position might be undefined when dragging ends
        const nodeToSave = nodes.find((n: any) => n.id === change.id)
        if (nodeToSave?.position && onUpdatePosition) {
          console.log('[QuestTree] Saving mission position:', change.id, nodeToSave.position)
          onUpdatePosition(change.id, nodeToSave.position)
        }
      }
    })
  }, [onNodesChange, onUpdatePosition, nodes])

  const handleNodeClick = useCallback((_event: any, node: any) => {
    onSelectQuest(node.id)
  }, [onSelectQuest])

  const handleEdgeClick = useCallback((event: any, edge: any) => {
    // Ctrl+Click to break the link
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      
      // Remove the edge from state
      setEdges((eds) => eds.filter((e) => e.id !== edge.id))
      
      // Call onRelink with true to indicate breaking the link
      if (onRelink) {
        onRelink(edge.source, edge.target, true) // true = breaking link
      }
    }
  }, [setEdges, onRelink])

  const handleConnect = useCallback((connection: any) => {
    if (onRelink && connection.source && connection.target) {
      onRelink(connection.source, connection.target)
    }
    setEdges((eds) => addEdge({ 
      ...connection, 
      animated: true, 
      style: { stroke: '#60a5fa', strokeWidth: 2 },
      label: 'next',
      labelStyle: { fill: '#fff', fontSize: 11, fontWeight: 'bold' },
      labelBgStyle: { fill: '#1e3a8a', fillOpacity: 0.8 },
      labelBgPadding: [4, 4],
      labelBgBorderRadius: 4,
    }, eds))
  }, [setEdges, onRelink])

  const handleAddNode = useCallback(() => {
    if (!onAddQuest) return
    onAddQuest()
  }, [onAddQuest])

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-slate-800 p-2 border-b border-slate-700">
        <button
          onClick={handleAddNode}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-sm rounded"
        >
          + Add Mission
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
        Tip: Drag from mission to create unlock relationships. Ctrl+Click edge to delete.
      </div>
    </div>
  )
}
