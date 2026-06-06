import { useEffect, useRef, useState } from 'react'

interface Live2DModelProps {
  modelUrl: string
  width?: number
  height?: number
}

export default function Live2DModel({ modelUrl, width = 300, height = 300 }: Live2DModelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Load live2d-widget library
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.0.min.js'
    script.async = true
    script.onload = () => {
      try {
        // @ts-ignore
        if (window.L2Dwidget) {
          // @ts-ignore
          window.L2Dwidget.init({
            model: {
              jsonPath: modelUrl,
            },
            display: {
              position: 'right',
              width: width,
              height: height,
              hOffset: 0,
              vOffset: 0,
            },
            mobile: {
              show: true,
              scale: 0.5,
            },
            react: {
              opacityDefault: 1,
              opacityOnHover: 1,
            },
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to init Live2D widget:', err)
        setError('模型初始化失败')
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
  }, [modelUrl, width, height])

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
