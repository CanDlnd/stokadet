import { useState } from 'react'
import type { Item } from '../types/database'
import { useUpdateStock, useDeleteItem } from '../hooks/useItems'

interface ItemRowProps {
  item: Item
  onEdit?: (item: Item) => void
}

export function ItemRow({ item, onEdit }: ItemRowProps) {
  const [quantity, setQuantity] = useState<string>('1')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const updateStock = useUpdateStock()
  const deleteItem = useDeleteItem()

  // Sadece pozitif tam sayı kabul et
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Sadece rakamları kabul et
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      setQuantity(value)
      setError(null)
    }
  }

  // Keyboard'da sadece rakam tuşlarına izin ver
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) {
      return
    }
    // Block 0 if input is empty (prevent leading zero)
    if (e.key === '0' && quantity === '') {
      e.preventDefault()
      return
    }
    // Block non-numeric
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

    // Büyük adetlerde onay sor
    if (qty >= 50) {
      const actionText = type === 'PURCHASE' ? 'alım' : 'satış'
      if (!confirm(`${qty} adet ${actionText} işlemi yapılacak. Onaylıyor musunuz?`)) {
        return
      }
    }

    // Satışta stok kontrolü
    if (type === 'SALE' && qty > item.stock) {
      setError(`Yetersiz stok! Mevcut: ${item.stock}, Satılmak istenen: ${qty}`)
      return
    }

    setIsProcessing(true)
    try {
      await updateStock.mutateAsync({
        itemId: item.id,
        quantity: qty,
        type,
        currentStock: item.stock,
      })
      setQuantity('1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = () => {
    if (confirm(`"${item.name}" ürünü silinsin mi?`)) {
      deleteItem.mutate(item.id)
    }
  }

  const isDisabled = isProcessing || updateStock.isPending || deleteItem.isPending

  return (
    <div className="group bg-[var(--color-bg)] rounded-lg p-3 hover:bg-[var(--color-primary)]/5 transition-colors">
      <div className="flex flex-col gap-3">
        {/* Üst kısım: Ürün bilgisi ve aksiyonlar */}
        <div className="flex items-start sm:items-center justify-between gap-2">
          {/* Ürün Bilgisi */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[var(--color-text)] truncate max-w-[200px] sm:max-w-none">
                {item.name}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    disabled={isDisabled}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded transition-all disabled:opacity-50"
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
                  className="p-1 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                  title="Sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-[var(--color-text-muted)]">Stok:</span>
              <span className={`text-lg font-bold tabular-nums ${
                item.stock === 0 
                  ? 'text-red-500' 
                  : item.stock < 5 
                    ? 'text-amber-500' 
                    : 'text-[var(--color-primary)]'
              }`}>
                {item.stock}
              </span>
              {item.stock === 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Tükendi
                </span>
              )}
              {item.stock > 0 && item.stock < 5 && (
                <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                  Az kaldı
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alt kısım: Stok Kontrolleri */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const current = parseInt(quantity) || 1
                if (current > 1) setQuantity(String(current - 1))
              }}
              disabled={isDisabled || parseInt(quantity) <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] disabled:opacity-40 transition-all"
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
              className="w-16 px-2 py-1.5 text-sm text-center rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
            />
            <button
              type="button"
              onClick={() => {
                const current = parseInt(quantity) || 0
                setQuantity(String(current + 1))
              }}
              disabled={isDisabled}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] disabled:opacity-40 transition-all"
            >
              +
            </button>
          </div>
          
          <button
            onClick={() => handleStockChange('PURCHASE')}
            disabled={isDisabled || !quantity}
            className="px-3 py-1.5 text-sm font-medium bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 min-w-[90px] justify-center"
          >
            {isProcessing && updateStock.variables?.type === 'PURCHASE' ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Alındı
              </>
            )}
          </button>
          
          <button
            onClick={() => handleStockChange('SALE')}
            disabled={isDisabled || !quantity || item.stock === 0}
            className="px-3 py-1.5 text-sm font-medium bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 min-w-[90px] justify-center"
          >
            {isProcessing && updateStock.variables?.type === 'SALE' ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Satıldı
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Hata Mesajı */}
      {error && (
        <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
