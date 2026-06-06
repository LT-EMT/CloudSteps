import { useEffect, useRef, useState } from 'react'

interface Live2DModelProps {
  modelUrl?: string
  width?: number
  height?: number
  message?: string
}

export default function Live2DModel({ modelUrl, width = 300, height = 300, message }: Live2DModelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Load Live2D library with Cubism runtime included
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/pixi.js@7.2.4/dist/pixi.min.js'
    script.async = true
    script.onload = () => {
      // Load live2d-cubism core
      const cubismScript = document.createElement('script')
      cubismScript.src = 'https://cdn.jsdelivr.net/npm/live2d-cubism-core@latest/live2dcubismcore.min.js'
      cubismScript.async = true
      cubismScript.onload = () => {
        // Load pixi-live2d-display
        const live2dScript = document.createElement('script')
        live2dScript.src = 'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.3.1/dist/index.min.js'
        live2dScript.async = true
        live2dScript.onload = () => {
          try {
            // @ts-ignore
            const { Application } = window.PIXI
            // @ts-ignore
            const { Live2DModel } = window.PIXI

            const app = new Application({
              view: containerRef.current?.querySelector('canvas') as HTMLCanvasElement,
              width,
              height,
              backgroundAlpha: 0,
              antialias: true,
            })

            // Use a public Live2D model
            const modelUrl = 'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.3.1/test/assets/shizuku/shizuku.model.json'

            Live2DModel.from(modelUrl).then((model: any) => {
              if (model) {
                model.scale.set(width / 2, height / 2)
                model.position.set(width / 2, height / 2)
                app.stage.addChild(model)
              }
              setLoading(false)
            }).catch((err: any) => {
              console.error('Failed to load Live2D model:', err)
              setError('模型加载失败')
              setLoading(false)
            })
          } catch (err) {
            console.error('Failed to initialize Live2D:', err)
            setError('Live2D 初始化失败')
            setLoading(false)
          }
        }
        document.head.appendChild(live2dScript)
      }
      document.head.appendChild(cubismScript)
    }
    document.head.appendChild(script)

    return () => {
      document.head.querySelectorAll('script[src*="pixi"]').forEach(el => el.remove())
      document.head.querySelectorAll('script[src*="live2d"]').forEach(el => el.remove())
    }
  }, [width, height])

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width, height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <canvas width={width} height={height} />
      </div>
      
      {/* 对话气泡 */}
      {message && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-white border-2 border-[#4ECDC4] rounded-2xl px-4 py-3 shadow-lg max-w-[250px] z-10">
          <div className="text-sm text-gray-800 leading-relaxed">{message}</div>
          {/* 气泡小三角 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
        </div>
      )}
      
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
