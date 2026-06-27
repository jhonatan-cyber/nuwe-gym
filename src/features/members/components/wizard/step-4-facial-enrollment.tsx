import { Scan, Camera, RefreshCw } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'

interface Step4Props {
  photoBase64: string | null
  cameraStream: MediaStream | null
  cameraStatus: string
  enrollmentMode: 'CAMERA' | 'BIOMETRIC'
  isConnectingDevice: boolean
  biometricStatus: string
  readerIp: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  onModeChange: (mode: 'CAMERA' | 'BIOMETRIC') => void
  onReaderIpChange: (ip: string) => void
  onStartCamera: () => void
  onCapturePhoto: () => void
  onSimulateBiometric: () => void
  onRecapture: () => void
}

export function Step4FacialEnrollment({
  photoBase64,
  cameraStream,
  cameraStatus,
  enrollmentMode,
  isConnectingDevice,
  biometricStatus,
  readerIp,
  videoRef,
  onModeChange,
  onReaderIpChange,
  onStartCamera,
  onCapturePhoto,
  onSimulateBiometric,
  onRecapture,
}: Step4Props) {
  const isCameraActive = !!cameraStream

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center max-w-md mx-auto">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}} />
      <div className="size-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-4">
        <Scan className="size-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
        Enrolamiento Facial
      </h2>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6 max-w-xs">
        Capturá la biometría facial del socio para ingreso rápido y seguro
      </p>

      <div className="flex w-full max-w-xs bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6 border border-gray-200 dark:border-white/5">
        <button
          type="button"
          onClick={() => { onModeChange('CAMERA') }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            enrollmentMode === 'CAMERA'
              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Cámara Web
        </button>
        <button
          type="button"
          onClick={() => { onModeChange('BIOMETRIC') }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            enrollmentMode === 'BIOMETRIC'
              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Lector de Red
        </button>
      </div>

      <div className="relative rounded-2xl border border-gray-200 dark:border-white/10 p-2 w-full max-w-xs mb-5 bg-gray-50 dark:bg-white/[0.02]">
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-200 dark:border-white/5 shadow-inner">
          {photoBase64 ? (
            <img src={photoBase64} alt="Captured face" className="w-full h-full object-cover animate-in fade-in duration-300" />
          ) : enrollmentMode === 'CAMERA' ? (
            isCameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute inset-4 border border-indigo-500/30 rounded-full pointer-events-none flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full animate-spin [animation-duration:15s]" />
                  <div className="size-48 border border-indigo-500/40 rounded-full" />
                </div>
                <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
                {cameraStatus && (
                  <div className="absolute bottom-4 inset-x-0 flex justify-center z-20">
                    <span className="bg-indigo-600/90 backdrop-blur-sm text-[9px] text-white font-extrabold px-3 py-1 rounded-full border border-indigo-400/30 uppercase tracking-widest animate-pulse">
                      {cameraStatus}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-white/30">
                <Camera className="size-12 mb-2 opacity-50" />
                <p className="text-xs font-semibold">Cámara inactiva</p>
              </div>
            )
          ) : isConnectingDevice ? (
            <div className="flex flex-col items-center justify-center p-6 text-center w-full h-full relative">
              <div className="size-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse max-w-[200px] z-10">
                {biometricStatus}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-white/30">
              <Scan className="size-12 mb-2 opacity-50 text-indigo-400" />
              <p className="text-xs font-semibold">Listo para conectar</p>
              <p className="text-[9px] mt-1 text-gray-500 uppercase tracking-wider">Lector IP: {readerIp}</p>
            </div>
          )}
        </div>
      </div>

      {enrollmentMode === 'BIOMETRIC' && !photoBase64 && !isConnectingDevice && (
        <div className="grid gap-1.5 w-full max-w-xs mb-4 text-left">
          <Label htmlFor="reader-ip" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            IP del Lector Biométrico
          </Label>
          <Input
            id="reader-ip"
            type="text"
            value={readerIp}
            onChange={(e) => onReaderIpChange(e.target.value)}
            placeholder="Ej: 192.168.1.201"
            className="h-9 text-xs"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 w-full max-w-xs">
        {photoBase64 ? (
          <Button type="button" variant="outline" onClick={onRecapture} className="w-full font-bold border-gray-300 dark:border-white/20 dark:text-white">
            <RefreshCw className="size-4 mr-2" /> Recapturar Foto
          </Button>
        ) : enrollmentMode === 'CAMERA' ? (
          isCameraActive ? (
            <Button
              type="button"
              onClick={onCapturePhoto}
              className="w-full font-black bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Camera className="size-4 mr-2" /> Capturar Ahora (Manual)
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onStartCamera}
              className="w-full font-black bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Camera className="size-4 mr-2" /> Activar Cámara
            </Button>
          )
        ) : (
          <Button
            type="button"
            onClick={onSimulateBiometric}
            disabled={isConnectingDevice}
            className="w-full font-black bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Scan className="size-4 mr-2" /> Iniciar Escaneo (Manual)
          </Button>
        )}
      </div>
    </div>
  )
}
