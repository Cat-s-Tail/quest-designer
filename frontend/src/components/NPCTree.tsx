import { useCallback, useMemo, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import CustomEdge from './CustomEdge'

const edgeTypes = {
  custom: CustomEdge,
}

const dagreGraph = new dagre.graphlib.Graph({ compound: true })
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 180
const nodeHeight = 60

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
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

export default function NPCTree({ npc, selectedOption, onSelectOption, onAddOption, onRelink, onBreakLink }) {
  const [npcId, setNpcId] = useState(npc?.id)
  
  const initialElements = useMemo(() => {
    if (!npc) return { nodes: [], edges: [] }
    
    const reactFlowNodes = []
    const reactFlowEdges = []

    // Root NPC node
    reactFlowNodes.push({
      id: `${npc.id}-root`,
      data: {
        label: (
          <div className="text-center">
            <div className="font-bold text-sm">{npc.name}</div>
            <div className="text-xs text-slate-400">NPC</div>
          </div>
        ),
        nodeId: 'root',
      },
      style: {
        background: '#1e40af',
        color: '#fff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '8px',
        fontWeight: 'bold',
      },
    })

    // Create option entry edges from root
    npc.options?.forEach((option, idx) => {
      if (option.entryNode) {
        reactFlowEdges.push({
          id: `root->${option.entryNode}`,
          source: `${npc.id}-root`,
          target: option.entryNode,
          type: 'custom',
          animated: false,
          style: { stroke: '#94a3b8' },
          data: {
            label: option.text,
            isBold: true,
          }
        })
      }
    })

    // Create nodes from flat node list and build edges from next/options
    npc.nodes?.forEach((node) => {
      reactFlowNodes.push({
        id: node.id,
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-xs">{node.name || node.id}</div>
              <div className="text-xs text-slate-400">{node.type}</div>
              {node.type === 'dialog' && node.texts?.[0] && (
                <div className="text-xs text-slate-500 truncate">{node.texts[0].substring(0, 20)}...</div>
              )}
              {node.type === 'commands' && (
                <div className="text-xs text-slate-500">{node.actions?.length || 0} actions</div>
              )}
              {node.type === 'options' && (
                <div className="text-xs text-slate-500">{node.options?.length || 0} choices</div>
              )}
              {node.type === 'condition' && (
                <div className="text-xs text-slate-500">{node.conditions?.length || 0} paths</div>
              )}
            </div>
          ),
          nodeId: node.id,
          nodeType: node.type,
        },
        style: {
          background: node.type === 'options' ? '#7c3aed' : node.type === 'condition' ? '#ea580c' : '#475569',
          color: '#fff',
          border: selectedOption?.nodeId === node.id ? '2px solid #60a5fa' : '1px solid #64748b',
          borderRadius: '6px',
          padding: '6px',
          fontSize: '12px',
        },
      })

      // Create edge from node.next
      if (node.next) {
        reactFlowEdges.push({
          id: `${node.id}->${node.next}`,
          source: node.id,
          target: node.next,
          type: 'custom',
          animated: false,
          style: { stroke: '#94a3b8' },
          data: {
            label: 'next',
            isBold: false,
          }
        })
      }

      // Create edges from node.options (for options type nodes)
      if (node.type === 'options' && node.options) {
        node.options.forEach((option, idx) => {
          if (option.entryNode) {
            reactFlowEdges.push({
              id: `${node.id}-option${idx}->${option.entryNode}`,
              source: node.id,
              target: option.entryNode,
              type: 'custom',
              animated: false,
              style: { stroke: '#94a3b8' },
              data: {
                label: option.text,
                isBold: true,
                optionIndex: idx
              }
            })
          }
        })
      }

      // Create edges from node.conditions (for condition type nodes)
      if (node.type === 'condition' && node.conditions) {
        node.conditions.forEach((condition, idx) => {
          const conditionData = typeof condition === 'object' ? condition : { condition, entryNode: null }
          if (conditionData.entryNode) {
            reactFlowEdges.push({
              id: `${node.id}-cond${idx}->${conditionData.entryNode}`,
              source: node.id,
              target: conditionData.entryNode,
              type: 'custom',
              animated: false,
              style: { stroke: '#ea580c' },
              data: {
                label: conditionData.condition,
                isBold: true,
                conditionIndex: idx
              }
            })
          }
        })
      }
    })

    return { nodes: reactFlowNodes, edges: reactFlowEdges }
  }, [npc, selectedOption])

  const layoutedElements = useMemo(() => {
    return getLayoutedElements(initialElements.nodes, initialElements.edges, 'TB')
  }, [initialElements])

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
      // Same NPC, update data but preserve positions
      setNodes(prevNodes => {
        const newNodesMap = new Map(layoutedElements.nodes.map(n => [n.id, n]))
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

  const handleNodeClick = useCallback((event, node) => {
    if (node.data?.nodeId) {
      onSelectOption({ nodeId: node.data.nodeId, type: node.data.nodeType })
    }
  }, [onSelectOption])

  const handleConnect = useCallback((connection) => {
    if (onRelink && connection.source && connection.target) {
      onRelink(connection.source, connection.target)
    }
    // For non-options nodes, remove old edges before adding new one
    const sourceNode = npc?.nodes?.find(n => n.id === connection.source.replace(`${npc.id}-root`, 'root'))
    if (sourceNode && sourceNode.type !== 'options') {
      setEdges((eds) => {
        // Remove existing edges from this source
        const filtered = eds.filter(e => e.source !== connection.source)
        // Add the new edge
        return addEdge({ ...connection, animated: false, style: { stroke: '#94a3b8' } }, filtered)
      })
    } else {
      setEdges((eds) => addEdge({ ...connection, animated: false, style: { stroke: '#94a3b8' } }, eds))
    }
  }, [setEdges, onRelink, npc])

  const handleEdgeClick = useCallback((event, edge) => {
    if ((event.ctrlKey || event.metaKey) && onBreakLink) {
      // Extract actual node IDs from edge
      const fromId = edge.source.replace(`${npc?.id}-root`, 'root')
      const toId = edge.target
      const optionIndex = edge.data?.optionIndex
      
      onBreakLink(fromId === 'root' ? edge.source : fromId, toId, optionIndex)
      
      // Remove edge from UI
      setEdges((eds) => eds.filter(e => e.id !== edge.id))
    }
  }, [onBreakLink, npc, setEdges])

  if (!npc) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-slate-400">
        Select an NPC to view options tree
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-slate-800 p-2 border-b border-slate-700">
        <button
          onClick={onAddOption}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-sm rounded"
        >
          + Add Node
        </button>
      </div>
      <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              edgeTypes={edgeTypes}
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
