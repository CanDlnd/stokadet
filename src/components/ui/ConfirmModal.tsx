import { useEffect, useRef } from 'react'

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmModalProps {
  isOpen: boolean
  type?: ConfirmType
  title: string
  message: string
  details?: {
    label: string
    value: string | number
  }[]
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const typeStyles = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    button: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
    iconSvg: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    iconSvg: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    icon: 'bg-blue-100 text-blue-600',
    button: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    iconSvg: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  success: {
    icon: 'bg-emerald-100 text-emerald-600',
    button: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
    iconSvg: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

export function ConfirmModal({
  isOpen,
  type = 'info',
  title,
  message,
  details,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const style = typeStyles[type]

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when modal opens
      setTimeout(() => confirmButtonRef.current?.focus(), 100)
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onCancel()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={!isLoading ? onCancel : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header with icon */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div className={`w-16 h-16 rounded-2xl ${style.icon} flex items-center justify-center mb-4 shadow-lg`}>
            {style.iconSvg}
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center">{title}</h3>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 text-center mb-4">{message}</p>
          
          {/* Details */}
          {details && details.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{detail.label}</span>
                  <span className="font-semibold text-gray-900">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-white ${style.button} transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                İşleniyor...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
