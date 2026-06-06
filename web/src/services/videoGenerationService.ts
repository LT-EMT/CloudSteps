/**
 * 视频生成服务 - 本地 Wav2Lip
 * 官方仓库: https://github.com/Rudrabha/Wav2Lip
 */

export type VideoGenerationProvider = 'local'

interface VideoGenerationConfig {
  provider: VideoGenerationProvider
  localApiUrl: string // 本地 API 地址，如 http://localhost:5000
}

class VideoGenerationService {
  private config: VideoGenerationConfig | null = null

  setConfig(config: VideoGenerationConfig) {
    this.config = config
  }

  /**
   * 生成带对口型的视频
   * @param imageUrl 人物图片 URL 或本地路径
   * @param audioUrl 音频 URL 或本地路径
   * @returns 视频 URL
   */
  async generateVideo(imageUrl: string, audioUrl: string): Promise<string> {
    if (!this.config) {
      throw new Error('视频生成服务未配置')
    }

    return this.generateWithLocal(imageUrl, audioUrl)
  }

  /**
   * 使用本地 Wav2Lip API 生成视频
   */
  private async generateWithLocal(imageUrl: string | File, audioUrl: string | File): Promise<string> {
    if (!this.config?.localApiUrl) {
      throw new Error('本地 API 地址未配置')
    }

    try {
      // 创建 FormData 用于上传文件
      const formData = new FormData()
      
      // 如果是 File 对象，上传；否则作为 URL 传递
      if (typeof imageUrl !== 'string') {
        formData.append('video', imageUrl)
      } else {
        formData.append('videoUrl', imageUrl)
      }
      
      if (typeof audioUrl !== 'string') {
        formData.append('audio', audioUrl)
      } else {
        formData.append('audioUrl', audioUrl)
      }

      const response = await fetch(`${this.config.localApiUrl}/api/video/generate`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`本地 API 错误: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '视频生成失败')
      }

      // 如果返回的是相对 URL，需要补全
      if (data.videoUrl.startsWith('/')) {
        return `${this.config.localApiUrl}${data.videoUrl}`
      }
      
      return data.videoUrl
    } catch (error) {
      console.error('本地 Wav2Lip 视频生成失败:', error)
      throw error
    }
  }

  /**
   * 获取任务状态
   */
  async getVideoStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    videoUrl?: string
    error?: string
  }> {
    if (!this.config?.localApiUrl) {
      throw new Error('本地 API 地址未配置')
    }

    const response = await fetch(`${this.config.localApiUrl}/api/video/status/${taskId}`)

    if (!response.ok) {
      throw new Error(`获取视频状态失败: ${response.statusText}`)
    }

    return response.json()
  }
}

export const videoGenerationService = new VideoGenerationService()

