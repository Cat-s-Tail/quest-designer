import React from 'react'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -100%) translate(${targetX}px,${targetY - 10}px)`,
            fontSize: 10,
            fontWeight: data?.isBold ? 'bold' : 'normal',
            background: '#1f2937',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: 3,
            border: '1px solid #94a3b8',
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan"
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

