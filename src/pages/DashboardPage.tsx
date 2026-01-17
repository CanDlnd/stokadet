import { useState, useMemo } from 'react'
import { useCategories, useCreateCategory } from '../hooks/useCategories'
import { useStockMovements, useUndoStockMovement } from '../hooks/useItems'
import { CategoryCard } from '../components/CategoryCard'

type DateFilter = 'all' | 'today' | 'week' | 'month'

export function DashboardPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { data: movements, isLoading: movementsLoading } = useStockMovements()
  const undoMovement = useUndoStockMovement()
  const createCategory = useCreateCategory()
  
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    await createCategory.mutateAsync(newCategoryName.trim())
    setNewCategoryName('')
    setIsAddingCategory(false)
  }

  // Filtrelenmiş hareketler
  const filteredMovements = useMemo(() => {
    if (!movements) return []
    
    let filtered = [...movements]
    
    // Tarih filtresi
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(m => {
        const date = new Date(m.created_at)
        switch (dateFilter) {
          case 'today':
            return date >= startOfDay
          case 'week': {
            const weekAgo = new Date(startOfDay)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return date >= weekAgo
          }
          case 'month': {
            const monthAgo = new Date(startOfDay)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return date >= monthAgo
          }
          default:
            return true
        }
      })
    }
    
    return filtered
  }, [movements, dateFilter])

  // CSV Export
  const exportToCSV = () => {
    if (!filteredMovements.length) return
    
    const headers = ['Tarih', 'Ürün', 'İşlem', 'Miktar']
    const rows = filteredMovements.map(m => [
      new Date(m.created_at).toLocaleString('tr-TR'),
      (m as any).items?.name || 'Bilinmeyen',
      m.type === 'PURCHASE' ? 'Alım' : 'Satış',
      m.quantity.toString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stok-gecmisi-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Geri al işlemi
  const handleUndo = async (movement: typeof movements extends (infer T)[] | undefined ? T : never) => {
    if (!movement) return
    
    const actionText = movement.type === 'PURCHASE' ? 'alım' : 'satış'
    if (!confirm(`Bu ${actionText} işlemini geri almak istiyor musunuz?\n\nÜrün: ${(movement as any).items?.name}\nMiktar: ${movement.quantity}`)) {
      return
    }
    
    try {
      await undoMovement.mutateAsync({
        movementId: movement.id,
        itemId: movement.item_id,
        type: movement.type,
        quantity: movement.quantity
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Geri alma işlemi başarısız')
    }
  }

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Stok Yönetim Paneli</h1>
            <p className="text-[var(--color-text-muted)] mt-1">Fizik tedavi malzemelerinizi yönetin</p>
          </div>
          
          {/* Sekmeler */}
          <div className="flex bg-[var(--color-surface)] rounded-lg p-1 border border-[var(--color-border)]">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'inventory'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Stok
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'history'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Geçmiş
            </button>
          </div>
        </div>

        {/* Arama (sadece stok sekmesinde) */}
        {activeTab === 'inventory' && categories && categories.length > 0 && (
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün veya kategori ara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Kategoriler Yükleniyor */}
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Kategori Listesi */}
              <div className="grid gap-6">
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <CategoryCard 
                      key={category.id} 
                      category={category} 
                      searchQuery={searchQuery}
                    />
                  ))
                ) : !isAddingCategory ? (
                  <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--color-text)]">Henüz kategori yok</h3>
                    <p className="text-[var(--color-text-muted)] mt-1 mb-4">İlk kategorinizi oluşturarak başlayın</p>
                    <button
                      onClick={() => setIsAddingCategory(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Kategori Ekle
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Kategori Ekleme Bölümü */}
              {isAddingCategory ? (
                <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-[var(--color-text)] mb-4">Yeni Kategori Ekle</h3>
                  <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="örn: İğne Uçları, Bandajlar, Elektrotlar..."
                      autoFocus
                      className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={createCategory.isPending || !newCategoryName.trim()}
                        className="flex-1 sm:flex-none px-6 py-2.5 font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
                      >
                        {createCategory.isPending ? 'Ekleniyor...' : 'Ekle'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false)
                          setNewCategoryName('')
                        }}
                        className="px-4 py-2.5 font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 rounded-lg transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              ) : categories && categories.length > 0 ? (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full py-4 text-[var(--color-primary)] font-medium hover:bg-[var(--color-primary)]/5 rounded-xl border-2 border-dashed border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Kategori Ekle
                </button>
              ) : null}
            </>
          )}
        </>
      ) : (
        /* Geçmiş Sekmesi */
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Stok Hareket Geçmişi</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {filteredMovements.length} hareket
                  {dateFilter !== 'all' && ` (${
                    dateFilter === 'today' ? 'bugün' : 
                    dateFilter === 'week' ? 'bu hafta' : 'bu ay'
                  })`}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Tarih Filtreleri */}
                <div className="flex bg-[var(--color-bg)] rounded-lg p-0.5 text-sm">
                  {[
                    { value: 'all', label: 'Tümü' },
                    { value: 'today', label: 'Bugün' },
                    { value: 'week', label: 'Hafta' },
                    { value: 'month', label: 'Ay' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDateFilter(value as DateFilter)}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        dateFilter === value
                          ? 'bg-[var(--color-surface)] shadow-sm font-medium text-[var(--color-text)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                
                {/* CSV Export */}
                <button
                  onClick={exportToCSV}
                  disabled={!filteredMovements.length}
                  className="px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">CSV İndir</span>
                </button>
              </div>
            </div>
          </div>
          
          {movementsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent"></div>
            </div>
          ) : filteredMovements.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {filteredMovements.map((movement) => (
                <div key={movement.id} className="px-4 sm:px-5 py-4 hover:bg-[var(--color-bg)] transition-colors group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        movement.type === 'PURCHASE' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {movement.type === 'PURCHASE' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-text)] truncate">
                          {(movement as any).items?.name || 'Bilinmeyen Ürün'}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {movement.type === 'PURCHASE' ? 'Alındı' : 'Satıldı'}: {movement.quantity} adet
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-semibold tabular-nums ${
                          movement.type === 'PURCHASE' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {movement.type === 'PURCHASE' ? '+' : '-'}{movement.quantity}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {new Date(movement.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {/* Geri Al Butonu */}
                      <button
                        onClick={() => handleUndo(movement)}
                        disabled={undoMovement.isPending}
                        className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        title="Geri Al"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text)]">
                {dateFilter === 'all' ? 'Henüz geçmiş yok' : 'Bu dönemde hareket yok'}
              </h3>
              <p className="text-[var(--color-text-muted)] mt-1">
                {dateFilter === 'all' 
                  ? 'Stok hareketleri burada görünecek'
                  : 'Farklı bir tarih aralığı seçin'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
