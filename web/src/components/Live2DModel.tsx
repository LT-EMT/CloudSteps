import { useEffect, useRef, useState } from 'react'

interface Live2DModelProps {
  modelUrl?: string
  width?: number
  height?: number
  message?: string
  audioElement?: HTMLAudioElement | null
}

export default function Live2DModel({ modelUrl, width = 300, height = 300, message, audioElement }: Live2DModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mouthOpen, setMouthOpen] = useState(0)
  const lipsyncRef = useRef<any>(null)
  const animationFrameRef = useRef<number>()

  // 初始化 wawa-lipsync
  useEffect(() => {
    if (!audioElement) return

    const initLipsync = async () => {
      try {
        const { Lipsync } = await import('wawa-lipsync')
        
        const lipsync = new Lipsync({
          audioElement: audioElement,
        })

        lipsync.on('lipsyncData', (data: any) => {
          if (data && data.mouthOpen !== undefined) {
            setMouthOpen(data.mouthOpen)
          }
        })

        lipsyncRef.current = lipsync
        lipsync.start()
      } catch (err) {
        console.warn('wawa-lipsync 加载失败，使用音频能量检测:', err)
        setupAudioEnergyDetection(audioElement)
      }
    }

    initLipsync()

    return () => {
      if (lipsyncRef.current) {
        lipsyncRef.current.stop()
      }
    }
  }, [audioElement])

  // 降级方案：音频能量检测
  const setupAudioEnergyDetection = (audioElement: HTMLAudioElement) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaElementSource(audioElement)
      
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateMouthFromAudio = () => {
        analyser.getByteFrequencyData(dataArray)
        
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const average = sum / dataArray.length / 255
        
        setMouthOpen(Math.min(average * 2, 1))
        
        animationFrameRef.current = requestAnimationFrame(updateMouthFromAudio)
      }

      updateMouthFromAudio()
    } catch (err) {
      console.error('音频能量检测初始化失败:', err)
    }
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawAvatar = () => {
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2

      // 头部光晕
      const gradient = ctx.createRadialGradient(centerX, centerY - 30, 0, centerX, centerY - 30, 120)
      gradient.addColorStop(0, 'rgba(78, 205, 196, 0.3)')
      gradient.addColorStop(1, 'rgba(78, 205, 196, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY - 30, 120, 0, Math.PI * 2)
      ctx.fill()

      // 头部
      const headGradient = ctx.createLinearGradient(centerX - 50, centerY - 80, centerX + 50, centerY + 20)
      headGradient.addColorStop(0, '#5FD3D3')
      headGradient.addColorStop(1, '#4ECDC4')
      ctx.fillStyle = headGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY - 30, 55, 0, Math.PI * 2)
      ctx.fill()

      // 头部高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.beginPath()
      ctx.arc(centerX - 20, centerY - 60, 15, 0, Math.PI * 2)
      ctx.fill()

      // 眼睛
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.ellipse(centerX - 22, centerY - 40, 16, 20, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(centerX + 22, centerY - 40, 16, 20, 0, 0, Math.PI * 2)
      ctx.fill()

      // 瞳孔
      ctx.fillStyle = '#2C3E50'
      ctx.beginPath()
      ctx.arc(centerX - 22, centerY - 38, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX + 22, centerY - 38, 8, 0, Math.PI * 2)
      ctx.fill()

      // 眼睛高光
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(centerX - 20, centerY - 40, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX + 24, centerY - 40, 3, 0, Math.PI * 2)
      ctx.fill()

      // 眉毛
      ctx.strokeStyle = '#2C3E50'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(centerX - 22, centerY - 55, 18, Math.PI * 0.7, Math.PI * 0.3, true)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(centerX + 22, centerY - 55, 18, Math.PI * 0.7, Math.PI * 0.3, true)
      ctx.stroke()

      // 鼻子
      ctx.strokeStyle = '#4ECDC4'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - 20)
      ctx.lineTo(centerX, centerY - 5)
      ctx.stroke()

      // 嘴巴
      ctx.strokeStyle = '#FF6B9D'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      const mouthRadius = 18
      const mouthOpenAmount = mouthOpen * 0.5
      ctx.arc(centerX, centerY + 10, mouthRadius, mouthOpenAmount, Math.PI - mouthOpenAmount)
      ctx.stroke()

      if (mouthOpen > 0.1) {
        ctx.fillStyle = 'rgba(255, 107, 157, 0.3)'
        ctx.beginPath()
        ctx.arc(centerX, centerY + 10, mouthRadius * 0.7, mouthOpenAmount, Math.PI - mouthOpenAmount)
        ctx.fill()
      }

      // 身体
      const bodyGradient = ctx.createLinearGradient(centerX, centerY + 30, centerX, centerY + 120)
      bodyGradient.addColorStop(0, '#66BB6A')
      bodyGradient.addColorStop(1, '#5AA85E')
      ctx.fillStyle = bodyGradient
      ctx.beginPath()
      ctx.ellipse(centerX, centerY + 70, 45, 50, 0, 0, Math.PI * 2)
      ctx.fill()

      // 身体高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.ellipse(centerX - 15, centerY + 50, 15, 25, -0.3, 0, Math.PI * 2)
      ctx.fill()

      // 手臂
      const armGradient = ctx.createLinearGradient(centerX - 60, centerY + 40, centerX - 60, centerY + 100)
      armGradient.addColorStop(0, '#5FD3D3')
      armGradient.addColorStop(1, '#4ECDC4')
      ctx.fillStyle = armGradient
      ctx.beginPath()
      ctx.ellipse(centerX - 60, centerY + 70, 12, 40, -0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = armGradient
      ctx.beginPath()
      ctx.ellipse(centerX + 60, centerY + 70, 12, 40, 0.2, 0, Math.PI * 2)
      ctx.fill()

      // 眨眼
      const time = Date.now() % 3000
      if (time > 2850) {
        const blinkProgress = (time - 2850) / 150
        const blinkHeight = 20 * (1 - Math.abs(blinkProgress * 2 - 1))
        
        ctx.fillStyle = '#5FD3D3'
        ctx.fillRect(centerX - 38, centerY - 50, 32, blinkHeight)
        ctx.fillRect(centerX + 6, centerY - 50, 32, blinkHeight)
      }
    }

    drawAvatar()

    const interval = setInterval(drawAvatar, 50)

    return () => {
      clearInterval(interval)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [width, height, mouthOpen])

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-lg"
        style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
      />

      {message && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-white border-2 border-[#4ECDC4] rounded-2xl px-4 py-3 shadow-lg max-w-[250px] z-10">
          <div className="text-sm text-gray-800 leading-relaxed">{message}</div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
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
