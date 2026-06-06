import { useEffect, useRef, useState } from 'react'
import { Application } from 'pixi.js'
import * as Live2D from 'pixi-live2d-display'

interface Live2DModelProps {
  modelUrl: string
  width?: number
  height?: number
}

export default function Live2DModel({ modelUrl, width = 300, height = 300 }: Live2DModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const app = new Application({
      view: canvasRef.current,
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
    })

    let model: any = null

    const loadModel = async () => {
      try {
        model = await Live2D.Live2DModel.from(modelUrl)
        if (model) {
          model.scale.set(width / 2, height / 2)
          model.position.set(width / 2, height / 2)
          app.stage.addChild(model)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to load Live2D model:', err)
        setError('模型加载失败')
        setLoading(false)
      }
    }

    loadModel()

    return () => {
      if (model) {
        app.stage.removeChild(model)
        model.destroy()
      }
      app.destroy(true)
    }
  }, [modelUrl, width, height])

  return (
    <div className="relative" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} />
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
