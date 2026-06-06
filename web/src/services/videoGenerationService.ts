/**
 * 视频生成服务 - 支持 Wav2Lip 和 SadTalker
 * 用于生成带对口型的 AI 视频
 */

export type VideoGenerationProvider = 'wav2lip' | 'sadtalker'

interface VideoGenerationConfig {
  provider: VideoGenerationProvider
  apiUrl: string // 后端 API 地址
}

class VideoGenerationService {
  private config: VideoGenerationConfig | null = null

  setConfig(config: VideoGenerationConfig) {
    this.config = config
  }

  /**
   * 生成带对口型的视频
   * @param imageUrl 人物图片 URL（可以是用户上传的照片）
   * @param audioUrl 音频 URL（AI 生成的语音）
   * @returns 视频 URL
   */
  async generateVideo(imageUrl: string, audioUrl: string): Promise<string> {
    if (!this.config) {
      throw new Error('视频生成服务未配置')
    }

    if (this.config.provider === 'wav2lip') {
      return this.generateWav2LipVideo(imageUrl, audioUrl)
    } else if (this.config.provider === 'sadtalker') {
      return this.generateSadTalkerVideo(imageUrl, audioUrl)
    }

    throw new Error('未知的视频生成提供商')
  }

  private async generateWav2LipVideo(imageUrl: string, audioUrl: string): Promise<string> {
    const response = await fetch(`${this.config!.apiUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'wav2lip',
        imageUrl,
        audioUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`Wav2Lip 视频生成失败: ${response.statusText}`)
    }

    const data = await response.json()
    return data.videoUrl
  }

  private async generateSadTalkerVideo(imageUrl: string, audioUrl: string): Promise<string> {
    const response = await fetch(`${this.config!.apiUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'sadtalker',
        imageUrl,
        audioUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`SadTalker 视频生成失败: ${response.statusText}`)
    }

    const data = await response.json()
    return data.videoUrl
  }

  /**
   * 轮询获取视频生成状态
   */
  async getVideoStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    videoUrl?: string
    error?: string
  }> {
    const response = await fetch(`${this.config!.apiUrl}/video/status/${taskId}`)

    if (!response.ok) {
      throw new Error(`获取视频状态失败: ${response.statusText}`)
    }

    return response.json()
  }
}

export const videoGenerationService = new VideoGenerationService()
