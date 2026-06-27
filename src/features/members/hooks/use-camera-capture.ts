import { useState, useRef, useCallback, useEffect } from 'react'

export function useCameraCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const start = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' },
        audio: false,
      })
      setStream(s)
    } catch {
      setStatus('Error al acceder a la cámara')
    }
  }, [])

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [stream])

  const capture = useCallback((): string | null => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 400
    canvas.height = videoRef.current.videoHeight || 400
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    stop()
    return dataUrl
  }, [stop])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    return () => { stop() }
  }, [stop])

  return { stream, status, videoRef, start, stop, capture, setStatus }
}
