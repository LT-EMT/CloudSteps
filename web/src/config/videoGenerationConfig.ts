import { videoGenerationService } from '@/services/videoGenerationService'

/**
 * 初始化视频生成服务
 * 支持两种模式：
 * 1. Replicate API（云服务，无需部署）
 * 2. 本地 API（自建 Wav2Lip 服务）
 */

export function initializeVideoGeneration() {
  // 从环境变量读取配置
  const provider = (import.meta.env.VITE_VIDEO_PROVIDER || 'replicate') as 'replicate' | 'local'
  const replicateApiKey = import.meta.env.VITE_REPLICATE_API_KEY
  const localApiUrl = import.meta.env.VITE_LOCAL_VIDEO_API_URL

  if (provider === 'replicate') {
    if (!replicateApiKey) {
      console.warn('Replicate API Key 未配置，请设置 VITE_REPLICATE_API_KEY 环境变量')
    }
    videoGenerationService.setConfig({
      provider: 'replicate',
      replicateApiKey,
    })
  } else if (provider === 'local') {
    if (!localApiUrl) {
      console.warn('本地 API URL 未配置，请设置 VITE_LOCAL_VIDEO_API_URL 环境变量')
    }
    videoGenerationService.setConfig({
      provider: 'local',
      localApiUrl,
    })
  }
}

/**
 * 环境变量配置说明：
 * 
 * Replicate 模式（推荐用于快速开发）：
 * VITE_VIDEO_PROVIDER=replicate
 * VITE_REPLICATE_API_KEY=r8_xxx... (从 https://replicate.com/account 获取)
 * 
 * 本地模式（用于自建 Wav2Lip 服务）：
 * VITE_VIDEO_PROVIDER=local
 * VITE_LOCAL_VIDEO_API_URL=http://localhost:5000
 */
