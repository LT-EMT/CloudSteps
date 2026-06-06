import { useState, useCallback } from 'react'
import { videoGenerationService } from '@/services/videoGenerationService'

interface UseVideoGenerationOptions {
  onSuccess?: (videoUrl: string) => void
  onError?: (error: Error) => void
}

export function useVideoGeneration(options?: UseVideoGenerationOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const generateVideo = useCallback(
    async (imageUrl: string, audioUrl: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const url = await videoGenerationService.generateVideo(imageUrl, audioUrl)
        setVideoUrl(url)
        options?.onSuccess?.(url)
        return url
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const reset = useCallback(() => {
    setVideoUrl(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    generateVideo,
    isLoading,
    error,
    videoUrl,
    reset,
  }
}
