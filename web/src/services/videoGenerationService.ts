/**
 * 视频生成服务 - 使用 Replicate API 调用 Wav2Lip
 * 官方仓库: https://github.com/Rudrabha/Wav2Lip
 */

export type VideoGenerationProvider = 'replicate' | 'local'

interface VideoGenerationConfig {
  provider: VideoGenerationProvider
  replicateApiKey?: string // Replicate API Key
  localApiUrl?: string // 本地 API 地址
}

interface GenerateVideoParams {
  imageUrl: string // 人物图片 URL
  audioUrl: string // 音频 URL
}

class VideoGenerationService {
  private config: VideoGenerationConfig | null = null

  setConfig(config: VideoGenerationConfig) {
    this.config = config
  }

  /**
   * 生成带对口型的视频
   * @param imageUrl 人物图片 URL
   * @param audioUrl 音频 URL
   * @returns 视频 URL
   */
  async generateVideo(imageUrl: string, audioUrl: string): Promise<string> {
    if (!this.config) {
      throw new Error('视频生成服务未配置')
    }

    if (this.config.provider === 'replicate') {
      return this.generateWithReplicate(imageUrl, audioUrl)
    } else if (this.config.provider === 'local') {
      return this.generateWithLocal(imageUrl, audioUrl)
    }

    throw new Error('未知的视频生成提供商')
  }

  /**
   * 使用 Replicate API 生成视频
   * Model: https://replicate.com/Rudrabha/Wav2Lip
   */
  private async generateWithReplicate(imageUrl: string, audioUrl: string): Promise<string> {
    if (!this.config?.replicateApiKey) {
      throw new Error('Replicate API Key 未配置')
    }

    try {
      // 第一步：创建预测任务
      const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.replicateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '8abccebf8e5d4ecf8e6b2d4e4e4e4e4', // Wav2Lip 官方模型版本
          input: {
            face: imageUrl,
            audio: audioUrl,
            still: false, // 是否使用静态图片模式
            pads: [0, 10, 0, 0], // 面部检测 padding
            face_det_batch_size: 16,
            wav2lip_batch_size: 128,
            resize_factor: 1,
            crop: [0, -1, 0, -1],
            box: [-1, -1, -1, -1],
            rotate: false,
            nosmooth: false,
          },
        }),
      })

      if (!createResponse.ok) {
        throw new Error(`Replicate API 错误: ${createResponse.statusText}`)
      }

      const prediction = await createResponse.json()
      const predictionId = prediction.id

      // 第二步：轮询获取结果
      return this.pollReplicatePrediction(predictionId)
    } catch (error) {
      console.error('Replicate 视频生成失败:', error)
      throw error
    }
  }

  /**
   * 轮询 Replicate 预测结果
   */
  private async pollReplicatePrediction(predictionId: string, maxAttempts = 120): Promise<string> {
    if (!this.config?.replicateApiKey) {
      throw new Error('Replicate API Key 未配置')
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.config.replicateApiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`获取预测状态失败: ${response.statusText}`)
      }

      const prediction = await response.json()

      if (prediction.status === 'succeeded') {
        // 返回生成的视频 URL
        return prediction.output
      } else if (prediction.status === 'failed') {
        throw new Error(`视频生成失败: ${prediction.error}`)
      }

      // 等待 2 秒后重试
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    throw new Error('视频生成超时')
  }

  /**
   * 使用本地 API 生成视频
   */
  private async generateWithLocal(imageUrl: string, audioUrl: string): Promise<string> {
    if (!this.config?.localApiUrl) {
      throw new Error('本地 API 地址未配置')
    }

    const response = await fetch(`${this.config.localApiUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        face: imageUrl,
        audio: audioUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`本地 API 错误: ${response.statusText}`)
    }

    const data = await response.json()
    return data.videoUrl
  }
}

export const videoGenerationService = new VideoGenerationService()

