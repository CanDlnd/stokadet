import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { ToastContainer, type ToastType } from '../components/ui/Toast'
import { ConfirmModal, type ConfirmType } from '../components/ui/ConfirmModal'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ConfirmOptions {
  type?: ConfirmType
  title: string
  message: string
  details?: { label: string; value: string | number }[]
  confirmText?: string
  cancelText?: string
}

interface NotificationContextType {
  showToast: (type: ToastType, title: string, message?: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: ((value: boolean) => void) | null
    isLoading: boolean
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    resolve: null,
    isLoading: false,
  })

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, type, title, message }])
  }, [])

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', title, message)
  }, [showToast])

  const showError = useCallback((title: string, message?: string) => {
    showToast('error', title, message)
  }, [showToast])

  const showWarning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message)
  }, [showToast])

  const showInfo = useCallback((title: string, message?: string) => {
    showToast('info', title, message)
  }, [showToast])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
        isLoading: false,
      })
    })
  }, [])

  const handleConfirm = () => {
    if (confirmState.resolve) {
      confirmState.resolve(true)
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }

  const handleCancel = () => {
    if (confirmState.resolve) {
      confirmState.resolve(false)
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }

  return (
    <NotificationContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo, confirm }}
    >
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        type={confirmState.options.type}
        title={confirmState.options.title}
        message={confirmState.options.message}
        details={confirmState.options.details}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        isLoading={confirmState.isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
