import { useCallback, useMemo, useState } from 'react'
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

export default function QuestTree({ quests, selectedQuest, onSelectQuest, onAddQuest, onRelink }: any) {
  const [_nodeIdCounter, _setNodeIdCounter] = useState(quests.length)

  // Build nodes from quests
  const initialNodes = useMemo(() => {
    return quests.map((quest: any) => ({
      id: quest.id,
      data: {
        label: (
          <div className="text-center">
            <div className="font-bold text-sm">{quest.title}</div>
            <div className="text-xs text-slate-400">{quest.difficulty}</div>
          </div>
        ),
      },
      style: {
        background: selectedQuest === quest.id ? '#2563eb' : '#334155',
        color: '#fff',
        border: selectedQuest === quest.id ? '2px solid #60a5fa' : '1px solid #64748b',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
      },
    }))
  }, [quests, selectedQuest])

  // Build edges from unlocks
  const initialEdges = useMemo(() => {
    const edges: any[] = []
    quests.forEach((quest: any) => {
      if (quest.unlocks && Array.isArray(quest.unlocks)) {
        quest.unlocks.forEach((unlockedId: string) => {
          edges.push({
            id: `${quest.id}->${unlockedId}`,
            source: quest.id,
            target: unlockedId,
            animated: true,
            style: { stroke: '#60a5fa' },
            label: (
              <div style={{
                background: '#1f2937',
                color: '#ffffff',
                fontSize: '12px',
                padding: '4px 8px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: '1px solid #60a5fa'
              }}>
                unlocks: {unlockedId}
              </div>
            ),
            labelBgStyle: { fill: 'transparent' },
            labelBgPadding: [0, 0],
            labelBgBorderRadius: 0,
          })
        })
      }
    })
    return edges
  }, [quests])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, 'TB')
  }, [initialNodes, initialEdges])

  const [nodes, _setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

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
      
      // Call onRelink with null to indicate breaking the link
      if (onRelink) {
        onRelink(edge.source, edge.target, true) // true = breaking link
      }
    }
  }, [setEdges, onRelink])

  const handleConnect = useCallback((connection: any) => {
    if (onRelink && connection.source && connection.target) {
      onRelink(connection.source, connection.target)
    }
    setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#60a5fa' } }, eds))
  }, [setEdges, onRelink])

  const handleAddNode = useCallback(() => {
    if (!onAddQuest) return
    const newQuest = {
      id: `quest_${Date.now()}`,
      title: 'New Quest',
      difficulty: 'easy',
      unlocks: [],
    }
    onAddQuest(newQuest)
  }, [onAddQuest])

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-slate-800 p-2 border-b border-slate-700">
        <button
          onClick={handleAddNode}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-sm rounded"
        >
          + Add Quest
        </button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
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
    </div>
  )
}

