import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2`}
    >
      <span className="font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  )
}

