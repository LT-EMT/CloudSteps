import { useEffect, useRef, useState } from 'react'

interface Live2DModelProps {
  modelUrl?: string
  width?: number
  height?: number
}

export default function Live2DModel({ modelUrl, width = 300, height = 300 }: Live2DModelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Use a simpler Live2D implementation without webpack dependency
    const script = document.createElement('script')
    script.src = 'https://fastly.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/autoload.js'
    script.async = true
    script.onload = () => {
      try {
        setLoading(false)
      } catch (err) {
        console.error('Failed to load Live2D:', err)
        setError('模型加载失败')
        setLoading(false)
      }
    }
    script.onerror = () => {
      setError('Live2D 库加载失败')
      setLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="relative" style={{ width, height }}>
      <div ref={containerRef} style={{ width, height }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  )
}
