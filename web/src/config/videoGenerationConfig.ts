import { videoGenerationService } from '@/services/videoGenerationService'

/**
 * 初始化视频生成服务
 * 使用本地 Wav2Lip API
 */

export function initializeVideoGeneration() {
  // 从环境变量读取本地 API 地址
  const localApiUrl = import.meta.env.VITE_LOCAL_VIDEO_API_URL || 'http://localhost:5000'

  videoGenerationService.setConfig({
    provider: 'local',
    localApiUrl,
  })

  console.log(`✅ 视频生成服务已初始化: ${localApiUrl}`)
}

/**
 * 环境变量配置说明：
 * 
 * VITE_LOCAL_VIDEO_API_URL=http://localhost:5000
 * 
 * 启动本地 Wav2Lip 服务器:
 * cd wav2lip_demo
 * python local_wav2lip_server.py
 */
