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

    // Add CSS to customize Live2D widget position and hide default dialogue
    const style = document.createElement('style')
    style.textContent = `
      #live2d-widget {
        position: relative !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        top: auto !important;
        transform: none !important;
      }
      .waifu-tips {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      .waifu-tool {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      .live2d-widget-dialogue {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `
    document.head.appendChild(style)

    // Configure Live2D widget
    // @ts-ignore
    window.live2d_settings = {
      showHitokoto: false,
      showF12Status: false,
      showCopyMessage: false,
      showWelcomeMessage: false,
    }

    // Use Live2D widget
    const script = document.createElement('script')
    script.src = 'https://fastly.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/autoload.js'
    script.async = true
    script.onload = () => {
      try {
        setLoading(false)
        
        // Move Live2D widget to our container
        const moveWidget = () => {
          const widget = document.querySelector('#live2d-widget')
          if (widget && containerRef.current) {
            containerRef.current.appendChild(widget)
          }
        }
        
        // Try to move immediately
        moveWidget()
        
        // Set up interval to keep trying
        const interval = setInterval(moveWidget, 100)
        
        // Clean up interval on unmount
        return () => clearInterval(interval)
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
      document.head.removeChild(style)
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width, height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
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
