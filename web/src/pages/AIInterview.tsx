import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Mic, MicOff, Camera, CameraOff, Send } from 'lucide-react'
import { useNavigate } from 'react-router'
import { FaceMesh } from '@mediapipe/face_mesh'
import { Camera as CameraUtils } from '@mediapipe/camera_utils'

export default function AIInterview() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([
    { role: 'ai', content: '你好！我是你的AI面试官。请打开摄像头，我们开始面试吧。' }
  ])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // MediaPipe Face Mesh setup
  const faceMeshRef = useRef<FaceMesh | null>(null)
  const cameraRef = useRef<CameraUtils | null>(null)

  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        }
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      faceMesh.onResults(onResults)
      faceMeshRef.current = faceMesh

      const camera = new CameraUtils(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current })
          }
        },
        width: 640,
        height: 480
      })

      camera.start()
      cameraRef.current = camera

      return () => {
        camera.stop()
        faceMesh.close()
      }
    }
  }, [isCameraOn])

  const onResults = (results: any) => {
    if (canvasRef.current && results.multiFaceLandmarks) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw face landmarks
      for (const landmarks of results.multiFaceLandmarks) {
        for (let i = 0; i < landmarks.length; i++) {
          const x = landmarks[i].x * canvas.width
          const y = landmarks[i].y * canvas.height
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, 2 * Math.PI)
          ctx.fillStyle = '#00FF00'
          ctx.fill()
        }
      }
      ctx.restore()
    }
  }

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      setIsCameraOn(false)
    } else {
      setIsCameraOn(true)
    }
  }

  const toggleMic = () => {
    setIsMicOn(!isMicOn)
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage = { role: 'user' as const, content: inputText }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsProcessing(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = { role: 'ai' as const, content: '我听到了，请继续...' }
      setMessages(prev => [...prev, aiMessage])
      setIsProcessing(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部栏 */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="relative z-10 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-[#2D3748]" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-[#2D3748] -ml-10 pointer-events-none">
            一对一场景聊天
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* 视频区域 */}
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            width={640}
            height={480}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <p className="text-white text-sm">摄像头已关闭</p>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-colors ${
              isCameraOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {isCameraOn ? <CameraOff size={24} /> : <Camera size={24} />}
          </button>
          <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition-colors ${
              isMicOn ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 bg-white rounded-xl p-4 overflow-y-auto space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-[#4ECDC4] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                AI正在思考...
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入消息..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4ECDC4]"
          />
          <button
            onClick={handleSendMessage}
            className="p-3 bg-[#4ECDC4] text-white rounded-xl hover:bg-[#45b8b0] transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
