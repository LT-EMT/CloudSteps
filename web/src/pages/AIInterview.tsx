import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Mic, MicOff, PhoneOff, MessageSquare } from "lucide-react";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { FaceMesh } from '@mediapipe/face_mesh'
import { Camera as CameraUtils } from '@mediapipe/camera_utils'
import { getWebSocketBaseURL } from "@/config/apiConfig";
import Live2DModel from "@/components/Live2DModel";

export default function AIInterview() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [ending, setEnding] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [expressionData, setExpressionData] = useState("");

  // MediaPipe Face Mesh setup
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<CameraUtils | null>(null);

  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      const camera = new CameraUtils(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current })
          }
        },
        width: 320,
        height: 240
      });

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

        // Extract simple expression data (mouth openness, eyebrow position)
        const mouthTop = landmarks[13]
        const mouthBottom = landmarks[14]
        const mouthOpenness = Math.abs(mouthBottom.y - mouthTop.y)
        
        const leftEyebrow = landmarks[70]
        const rightEyebrow = landmarks[300]
        const eyebrowAvg = (leftEyebrow.y + rightEyebrow.y) / 2
        
        // Update expression data (subtle hints)
        const hints = []
        if (mouthOpenness > 0.05) hints.push("mouth_open")
        if (eyebrowAvg < 0.3) hints.push("eyebrow_raised")
        setExpressionData(hints.join(","))
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

  // WebSocket setup for realtime voice
  const wsUrl = useMemo(() => {
    const wsBase = getWebSocketBaseURL()
    const host = wsBase.replace(/\/$/, "")
    return `${host}/api/ws/realtime/ai-interview`
  }, [])

  const voice = useRealtimeVoice({
    wsUrl,
    expressionData,
    onUserText: (text) => {
      console.log("User said:", text)
    },
    onAssistantText: (text) => {
      console.log("AI said:", text)
    },
    onError: (msg) => setConnectError(msg),
    onConnected: () => {
      console.log("Connected to AI interview")
    },
  })

  useEffect(() => {
    setConnectError("")
    voice.connect()
    return () => voice.disconnect()
  }, [])

  const handleEnd = async () => {
    if (ending) return
    setEnding(true)
    voice.disconnect()
    navigate("/material-selection", { replace: true })
  }

  const statusLabel: Record<string, string> = {
    idle: "准备中",
    connecting: "连接中...",
    connected: "对话中 — 请开口说话",
    disconnected: "已断开",
    error: "连接失败",
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FAF9] to-[#F7F9FC] flex flex-col">
      <div className="bg-white/80 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} className="text-[#2D3748]" />
          </button>
          <div className="flex-1 text-center -ml-10">
            <h1 className="text-lg font-semibold text-[#2D3748]">一对一场景聊天</h1>
            <p className="text-xs text-[#718096]">{statusLabel[voice.status]}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {(connectError || voice.status === "error") && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <p className="text-sm font-medium text-red-700 mb-2">语音连接失败</p>
            <p className="text-xs text-red-600 whitespace-pre-wrap">
              {connectError || "realtime init failed"}
            </p>
            <button
              onClick={() => { setConnectError(""); voice.connect(); }}
              className="mt-3 text-sm text-red-700 underline"
            >
              重试连接
            </button>
          </div>
        )}

        {/* Live2D 数字人区域 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-[#66BB6A]" />
            <span className="text-sm font-medium text-[#718096]">AI 数字人</span>
          </div>
          <div className="flex justify-center">
            <Live2DModel width={300} height={300} message={voice.assistantText} />
          </div>
        </div>

        {/* 摄像头区域 - 缩小 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#718096]">摄像头</span>
              {expressionData && (
                <span className="text-xs text-gray-400">({expressionData})</span>
              )}
            </div>
            <button
              onClick={toggleCamera}
              className={`text-xs px-2 py-1 rounded ${isCameraOn ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
            >
              {isCameraOn ? '关闭' : '开启'}
            </button>
          </div>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              width={320}
              height={240}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <p className="text-white text-xs">摄像头已关闭</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#55A3FF]/30">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-[#55A3FF]" />
            <span className="text-sm font-medium text-[#718096]">你说</span>
          </div>
          <p className="text-[#2D3748] min-h-[2rem]">{voice.userText || "..."}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#66BB6A]/30">
          <div className="flex items-center gap-2 mb-2">
            <Mic size={16} className="text-[#66BB6A]" />
            <span className="text-sm font-medium text-[#718096]">AI 陪练</span>
          </div>
          <p className="text-[#2D3748] min-h-[2rem] whitespace-pre-wrap">{voice.assistantText || "..."}</p>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-[#E2E8F0] px-6 py-5">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={voice.interrupt}
            disabled={!voice.isConnected}
            className="p-4 rounded-full bg-[#55A3FF]/10 text-[#55A3FF] disabled:opacity-40"
            title="打断 AI"
          >
            <MicOff size={24} />
          </button>

          <button
            onClick={handleEnd}
            disabled={ending}
            className="p-5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 disabled:opacity-60"
            title="结束对话"
          >
            <PhoneOff size={28} />
          </button>

          <div className={`p-4 rounded-full ${voice.isConnected ? "bg-[#66BB6A]/10 text-[#66BB6A] animate-pulse" : "bg-gray-100 text-gray-400"}`}>
            <Mic size={24} />
          </div>
        </div>
        <p className="text-center text-xs text-[#A0AEC0] mt-3">
          {ending ? "正在结束..." : "点击红色按钮结束对话"}
        </p>
      </div>
    </div>
  )
}
