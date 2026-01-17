import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const icons = {
  success: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const styles = {
  success: {
    bg: 'bg-gradient-to-r from-emerald-500 to-green-600',
    icon: 'text-white',
    progress: 'bg-white/30',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-500 to-rose-600',
    icon: 'text-white',
    progress: 'bg-white/30',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    icon: 'text-white',
    progress: 'bg-white/30',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    icon: 'text-white',
    progress: 'bg-white/30',
  },
}

export function Toast({ id, type, title, message, duration = 4000, onClose }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 50)

    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(id), 300)
  }

  const style = styles[type]

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl shadow-2xl ${style.bg} text-white
        transform transition-all duration-300 ease-out
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{ minWidth: '320px', maxWidth: '400px' }}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 ${style.icon}`}>
          {icons[type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-white/80">{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-1 ${style.progress} transition-all duration-100`} style={{ width: `${progress}%` }} />
    </div>
  )
}

// Toast Container
interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    title: string
    message?: string
  }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}
