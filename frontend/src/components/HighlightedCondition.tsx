export default function HighlightedCondition({ text }) {
  if (!text) return <span className="text-slate-400">-</span>

  // Split by AND/OR/NOT/() while preserving the operators
  const parts = text.split(/(\bAND\b|\bOR\b|\bNOT\b|[()])/gi)

  return (
    <div className="font-mono text-sm leading-relaxed inline">
      {parts.map((part, index) => {
        if (!part) return null

        const upperPart = part.toUpperCase()
        if (upperPart === 'AND') {
          return (
            <span key={index} className="bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded mx-0.5">
              AND
            </span>
          )
        }
        if (upperPart === 'OR') {
          return (
            <span key={index} className="bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded mx-0.5">
              OR
            </span>
          )
        }
        if (upperPart === 'NOT') {
          return (
            <span key={index} className="bg-red-900 text-red-200 px-1.5 py-0.5 rounded mx-0.5">
              NOT
            </span>
          )
        }
        if (part === '(' || part === ')') {
          return (
            <span key={index} className="bg-yellow-900 text-yellow-200 px-1 py-0.5 rounded mx-0.5 font-bold">
              {part}
            </span>
          )
        }

        return (
          <span key={index} className="text-slate-300">
            {part}
          </span>
        )
      })}
    </div>
  )
}


