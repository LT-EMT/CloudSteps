/**
 * TTS 服务 - 支持 OpenAI 和 ElevenLabs
 */

export type TTSProvider = 'openai' | 'elevenlabs'

interface TTSConfig {
  provider: TTSProvider
  apiKey: string
  voiceId?: string // ElevenLabs 需要
}

class TTSService {
  private config: TTSConfig | null = null

  setConfig(config: TTSConfig) {
    this.config = config
  }

  async generateSpeech(text: string): Promise<ArrayBuffer> {
    if (!this.config) {
      throw new Error('TTS 服务未配置')
    }

    if (this.config.provider === 'openai') {
      return this.generateOpenAISpeech(text)
    } else if (this.config.provider === 'elevenlabs') {
      return this.generateElevenLabsSpeech(text)
    }

    throw new Error('未知的 TTS 提供商')
  }

  private async generateOpenAISpeech(text: string): Promise<ArrayBuffer> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: 'alloy', // 可选: alloy, echo, fable, onyx, nova, shimmer
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS 错误: ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  private async generateElevenLabsSpeech(text: string): Promise<ArrayBuffer> {
    const voiceId = this.config!.voiceId || '21m00Tcm4TlvDq8ikWAM' // 默认女性声音
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.config!.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS 错误: ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  async playAudio(audioBuffer: ArrayBuffer, audioElement: HTMLAudioElement) {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    audioElement.src = url
    await audioElement.play()
  }
}

export const ttsService = new TTSService()
