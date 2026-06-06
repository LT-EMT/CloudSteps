import { useCallback, useRef, useState } from 'react'

const SAMPLE_RATE = 16000
const FRAME_MS = 20
const FRAME_SAMPLES = Math.floor(SAMPLE_RATE * FRAME_MS / 1000)

export type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseRealtimeVoiceOptions {
  wsUrl: string
  onUserText?: (text: string) => void
  onAssistantText?: (text: string) => void
  onError?: (message: string) => void
  onConnected?: () => void
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions) {
  const { wsUrl, onUserText, onAssistantText, onError, onConnected } = options
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [userText, setUserText] = useState('')
  const [assistantText, setAssistantText] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const captureCtxRef = useRef<AudioContext | null>(null)
  const playbackCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const pcmSendBufRef = useRef<Int16Array>(new Int16Array(0))
  const listeningRef = useRef(false)
  const playbackRateRef = useRef(SAMPLE_RATE)
  const nextPlayTimeRef = useRef(0)
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([])

  const downsample = (input: Float32Array, fromRate: number, toRate: number) => {
    if (fromRate === toRate) return input
    const ratio = fromRate / toRate
    const outLen = Math.floor(input.length / ratio)
    const out = new Float32Array(outLen)
    for (let i = 0; i < outLen; i++) {
      out[i] = input[Math.floor(i * ratio)] || 0
    }
    return out
  }

  const floatToInt16 = (floats: Float32Array) => {
    const out = new Int16Array(floats.length)
    for (let i = 0; i < floats.length; i++) {
      const s = Math.max(-1, Math.min(1, floats[i]))
      out[i] = s < 0 ? s * 32768 : s * 32767
    }
    return out
  }

  const appendPCM = useCallback((int16: Int16Array) => {
    const merged = new Int16Array(pcmSendBufRef.current.length + int16.length)
    merged.set(pcmSendBufRef.current)
    merged.set(int16, pcmSendBufRef.current.length)
    pcmSendBufRef.current = merged
    while (pcmSendBufRef.current.length >= FRAME_SAMPLES) {
      const frame = pcmSendBufRef.current.slice(0, FRAME_SAMPLES)
      pcmSendBufRef.current = pcmSendBufRef.current.slice(FRAME_SAMPLES)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(frame.buffer)
      }
    }
  }, [])

  const stopPlayback = useCallback(() => {
    playbackSourcesRef.current.forEach((s) => {
      try { s.stop() } catch { /* ignore */ }
    })
    playbackSourcesRef.current = []
    nextPlayTimeRef.current = playbackCtxRef.current?.currentTime ?? 0
  }, [])

  const playPCM = useCallback((bytes: Uint8Array) => {
    const rate = playbackRateRef.current
    if (!playbackCtxRef.current || playbackCtxRef.current.sampleRate !== rate) {
      stopPlayback()
      playbackCtxRef.current?.close()
      playbackCtxRef.current = new AudioContext({ sampleRate: rate })
    }
    const ctx = playbackCtxRef.current!
    if (ctx.state === 'suspended') ctx.resume()
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2)
    const floats = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) floats[i] = int16[i] / 32768
    const buffer = ctx.createBuffer(1, floats.length, rate)
    buffer.copyToChannel(floats, 0)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    const now = ctx.currentTime
    if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now
    src.start(nextPlayTimeRef.current)
    nextPlayTimeRef.current += buffer.duration
    playbackSourcesRef.current.push(src)
    src.onended = () => {
      playbackSourcesRef.current = playbackSourcesRef.current.filter((x) => x !== src)
    }
  }, [stopPlayback])

  const sendJSON = useCallback((obj: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj))
    }
  }, [])

  const stopMic = useCallback(() => {
    processorRef.current?.disconnect()
    if (processorRef.current) processorRef.current.onaudioprocess = null
    processorRef.current = null
    captureCtxRef.current?.close()
    captureCtxRef.current = null
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    pcmSendBufRef.current = new Int16Array(0)
  }, [])

  const cleanup = useCallback((notifyStop: boolean) => {
    listeningRef.current = false
    if (notifyStop) sendJSON({ type: 'listen', state: 'stop' })
    stopMic()
    stopPlayback()
    if (wsRef.current) {
      wsRef.current.onclose = null
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close()
      }
      wsRef.current = null
    }
  }, [sendJSON, stopMic, stopPlayback])

  const handleText = useCallback((raw: string) => {
    let msg: Record<string, unknown>
    try { msg = JSON.parse(raw) } catch { return }
    switch (msg.type) {
      case 'hello': {
        const ap = (msg.audio_params as Record<string, number>) || {}
        if (ap.sample_rate > 0) playbackRateRef.current = ap.sample_rate
        setStatus('connected')
        sendJSON({ type: 'listen', state: 'start', mode: 'auto' })
        listeningRef.current = true
        onConnected?.()
        break
      }
      case 'stt': {
        const text = String(msg.text || '')
        setUserText(text)
        onUserText?.(text)
        break
      }
      case 'llm_response': {
        const text = String(msg.text || '')
        setAssistantText(text)
        onAssistantText?.(text)
        break
      }
      case 'tts':
        if (msg.state === 'start') stopPlayback()
        break
      case 'error': {
        const message = String(msg.message || 'unknown error')
        onError?.(message)
        if (msg.fatal) setStatus('error')
        break
      }
    }
  }, [onAssistantText, onConnected, onError, onUserText, sendJSON, stopPlayback])

  const connect = useCallback(async () => {
    if (!wsUrl) return
    setStatus('connecting')
    cleanup(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
        video: false,
      })
      micStreamRef.current = stream
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
      captureCtxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      processor.onaudioprocess = (ev) => {
        if (!listeningRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return
        const input = ev.inputBuffer.getChannelData(0)
        const down = downsample(input, ctx.sampleRate, SAMPLE_RATE)
        appendPCM(floatToInt16(down))
      }
      source.connect(processor)
      const mute = ctx.createGain()
      mute.gain.value = 0
      processor.connect(mute)
      mute.connect(ctx.destination)

      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        sendJSON({
          type: 'hello',
          version: 1,
          transport: 'websocket',
          audio_params: {
            format: 'pcm',
            sample_rate: SAMPLE_RATE,
            channels: 1,
            frame_duration: FRAME_MS,
            bit_depth: 16,
          },
        })
      }
      ws.onmessage = (ev) => {
        if (typeof ev.data === 'string') handleText(ev.data)
        else if (ev.data instanceof ArrayBuffer) playPCM(new Uint8Array(ev.data))
      }
      ws.onerror = () => {
        setStatus('error')
        onError?.('WebSocket 连接失败')
      }
      ws.onclose = () => {
        setStatus('disconnected')
        cleanup(false)
      }
    } catch (err: unknown) {
      setStatus('error')
      onError?.(err instanceof Error ? err.message : '麦克风权限获取失败')
      cleanup(false)
    }
  }, [appendPCM, cleanup, handleText, onError, playPCM, sendJSON, wsUrl])

  const disconnect = useCallback(() => {
    cleanup(true)
    setStatus('idle')
  }, [cleanup])

  const interrupt = useCallback(() => {
    sendJSON({ type: 'abort' })
    stopPlayback()
  }, [sendJSON, stopPlayback])

  return {
    status,
    userText,
    assistantText,
    connect,
    disconnect,
    interrupt,
    isConnected: status === 'connected',
  }
}
