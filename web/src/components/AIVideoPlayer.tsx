import { useEffect, useRef, useState } from 'react'

interface AIVideoPlayerProps {
  videoUrl?: string
  isLoading?: boolean
  error?: string
  message?: string
}

export default function AIVideoPlayer({ videoUrl, isLoading = false, error, message }: AIVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl
      videoRef.current.play().catch(err => {
        console.error('视频播放失败:', err)
      })
      setIsPlaying(true)
    }
  }, [videoUrl])

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* 视频容器 */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            controls
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-sm">生成视频中...</p>
              </div>
            ) : error ? (
              <p className="text-red-400 text-sm text-center px-4">{error}</p>
            ) : (
              <p className="text-gray-400 text-sm">等待生成视频...</p>
            )}
          </div>
        )}
      </div>

      {/* 对话气泡 */}
      {message && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white border-2 border-[#4ECDC4] rounded-2xl px-4 py-3 shadow-lg max-w-[300px] z-10 whitespace-normal">
          <div className="text-sm text-gray-800 leading-relaxed">{message}</div>
          {/* 气泡小三角 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
        </div>
      )}

      {/* 播放状态指示 */}
      {isPlaying && (
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-xs">播放中</span>
        </div>
      )}
    </div>
  )
}
