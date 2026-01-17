import { useState } from 'react'
import type { Item } from '../types/database'
import { useUpdateStock, useDeleteItem } from '../hooks/useItems'
import { useNotification } from '../contexts/NotificationContext'

interface ItemRowProps {
  item: Item
  onEdit?: (item: Item) => void
}

export function ItemRow({ item, onEdit }: ItemRowProps) {
  const [quantity, setQuantity] = useState<string>('1')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [successAnimation, setSuccessAnimation] = useState<'purchase' | 'sale' | null>(null)
  const updateStock = useUpdateStock()
  const deleteItem = useDeleteItem()
  const { showSuccess, showError, confirm } = useNotification()

  // Sadece pozitif tam sayı kabul et
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      setQuantity(value)
      setError(null)
    }
  }

  // Keyboard'da sadece rakam tuşlarına izin ver
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) {
      return
    }
    if (e.key === '0' && quantity === '') {
      e.preventDefault()
      return
    }
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handleStockChange = async (type: 'PURCHASE' | 'SALE') => {
    setError(null)
    const qty = parseInt(quantity) || 0
    
    if (qty <= 0) {
      setError('Miktar 0\'dan büyük olmalıdır')
      return
    }

    // Satışta stok kontrolü
    if (type === 'SALE' && qty > item.stock) {
      setError(`Yetersiz stok! Mevcut: ${item.stock}`)
      showError('Yetersiz Stok', `Satılmak istenen: ${qty}, Mevcut: ${item.stock}`)
      return
    }

    const actionText = type === 'PURCHASE' ? 'Alım' : 'Satış'
    const actionIcon = type === 'PURCHASE' ? '📦' : '💰'
    
    // Onay modalı göster
    const confirmed = await confirm({
      type: type === 'PURCHASE' ? 'success' : 'warning',
      title: `${actionIcon} ${actionText} Onayı`,
      message: `Bu işlemi onaylıyor musunuz?`,
      details: [
        { label: 'Ürün', value: item.name },
        { label: 'Miktar', value: `${qty} adet` },
        { label: 'İşlem', value: actionText },
        { label: 'Mevcut Stok', value: item.stock },
        { label: 'Yeni Stok', value: type === 'PURCHASE' ? item.stock + qty : item.stock - qty },
      ],
      confirmText: `${actionText} Yap`,
      cancelText: 'Vazgeç',
    })

    if (!confirmed) return

    setIsProcessing(true)
    try {
      await updateStock.mutateAsync({
        itemId: item.id,
        quantity: qty,
        type,
        currentStock: item.stock,
      })
      
      // Başarı animasyonu
      setSuccessAnimation(type === 'PURCHASE' ? 'purchase' : 'sale')
      setTimeout(() => setSuccessAnimation(null), 1000)
      
      // Başarı bildirimi
      const newStock = type === 'PURCHASE' ? item.stock + qty : item.stock - qty
      showSuccess(
        `${actionText} Başarılı! ✓`,
        `${item.name}: ${qty} adet ${type === 'PURCHASE' ? 'eklendi' : 'satıldı'}. Yeni stok: ${newStock}`
      )
      
      setQuantity('1')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu'
      setError(errorMsg)
      showError('İşlem Başarısız', errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      type: 'danger',
      title: '🗑️ Ürün Silme',
      message: 'Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      details: [
        { label: 'Ürün Adı', value: item.name },
        { label: 'Mevcut Stok', value: item.stock },
      ],
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
    })

    if (confirmed) {
      try {
        await deleteItem.mutateAsync(item.id)
        showSuccess('Ürün Silindi', `"${item.name}" başarıyla silindi`)
      } catch (err) {
        showError('Silme Başarısız', err instanceof Error ? err.message : 'Bir hata oluştu')
      }
    }
  }

  const isDisabled = isProcessing || updateStock.isPending || deleteItem.isPending

  return (
    <div 
      className={`
        group bg-[var(--color-bg)] rounded-xl p-4 
        hover:bg-gradient-to-r hover:from-[var(--color-primary)]/5 hover:to-transparent
        transition-all duration-300 border border-transparent hover:border-[var(--color-primary)]/20
        ${successAnimation === 'purchase' ? 'animate-bounce-in ring-2 ring-emerald-400' : ''}
        ${successAnimation === 'sale' ? 'animate-bounce-in ring-2 ring-amber-400' : ''}
      `}
    >
      <div className="flex flex-col gap-4">
        {/* Üst kısım: Ürün bilgisi ve aksiyonlar */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          {/* Ürün Bilgisi */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[var(--color-text)] text-base">
                {item.name}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    disabled={isDisabled}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-all disabled:opacity-50"
                    title="Düzenle"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isDisabled}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                  title="Sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Stok Göstergesi */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <div className={`
                  w-3 h-3 rounded-full
                  ${item.stock === 0 ? 'bg-red-500 animate-pulse-soft' : ''}
                  ${item.stock > 0 && item.stock < 5 ? 'bg-amber-500 animate-pulse-soft' : ''}
                  ${item.stock >= 5 ? 'bg-emerald-500' : ''}
                `} />
                <span className="text-sm text-[var(--color-text-muted)]">Stok:</span>
              </div>
              <span className={`
                text-2xl font-bold tabular-nums
                ${item.stock === 0 ? 'text-red-500' : ''}
                ${item.stock > 0 && item.stock < 5 ? 'text-amber-500' : ''}
                ${item.stock >= 5 ? 'text-[var(--color-primary)]' : ''}
              `}>
                {item.stock}
              </span>
              {item.stock === 0 && (
                <span className="text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full animate-pulse-soft">
                  Tükendi
                </span>
              )}
              {item.stock > 0 && item.stock < 5 && (
                <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  Az Kaldı
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alt kısım: Stok Kontrolleri */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Miktar Kontrolü */}
          <div className="flex items-center bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => {
                const current = parseInt(quantity) || 1
                if (current > 1) setQuantity(String(current - 1))
              }}
              disabled={isDisabled || parseInt(quantity) <= 1}
              className="w-10 h-10 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] disabled:opacity-40 transition-all text-lg font-medium"
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[1-9][0-9]*"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              placeholder="1"
              className="w-14 py-2 text-center font-semibold text-[var(--color-text)] focus:outline-none disabled:opacity-50 disabled:bg-gray-50 border-x border-[var(--color-border)]"
            />
            <button
              type="button"
              onClick={() => {
                const current = parseInt(quantity) || 0
                setQuantity(String(current + 1))
              }}
              disabled={isDisabled}
              className="w-10 h-10 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] disabled:opacity-40 transition-all text-lg font-medium"
            >
              +
            </button>
          </div>
          
          {/* Alım Butonu */}
          <button
            onClick={() => handleStockChange('PURCHASE')}
            disabled={isDisabled || !quantity}
            className={`
              px-5 py-2.5 text-sm font-semibold text-white rounded-xl
              bg-gradient-to-r from-emerald-500 to-green-600 
              hover:from-emerald-600 hover:to-green-700 hover:shadow-lg hover:glow-success
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
              transition-all duration-200 flex items-center gap-2 min-w-[110px] justify-center
              shadow-md
            `}
          >
            {isProcessing && updateStock.variables?.type === 'PURCHASE' ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Alındı
              </>
            )}
          </button>
          
          {/* Satış Butonu */}
          <button
            onClick={() => handleStockChange('SALE')}
            disabled={isDisabled || !quantity || item.stock === 0}
            className={`
              px-5 py-2.5 text-sm font-semibold text-white rounded-xl
              bg-gradient-to-r from-amber-500 to-orange-500 
              hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:glow-warning
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
              transition-all duration-200 flex items-center gap-2 min-w-[110px] justify-center
              shadow-md
            `}
          >
            {isProcessing && updateStock.variables?.type === 'SALE' ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
                Satıldı
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Hata Mesajı */}
      {error && (
        <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2 animate-shake">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
