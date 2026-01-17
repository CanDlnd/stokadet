import { useState, useMemo } from 'react'
import { useCategories, useCreateCategory } from '../hooks/useCategories'
import { useStockMovements, useUndoStockMovement } from '../hooks/useItems'
import { CategoryCard } from '../components/CategoryCard'
import { useNotification } from '../contexts/NotificationContext'

type DateFilter = 'all' | 'today' | 'week' | 'month'

export function DashboardPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { data: movements, isLoading: movementsLoading } = useStockMovements()
  const undoMovement = useUndoStockMovement()
  const createCategory = useCreateCategory()
  const { showSuccess, showError, confirm } = useNotification()
  
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      await createCategory.mutateAsync(newCategoryName.trim())
      showSuccess('Kategori Oluşturuldu', `"${newCategoryName.trim()}" başarıyla eklendi`)
      setNewCategoryName('')
      setIsAddingCategory(false)
    } catch (err) {
      showError('Kategori Eklenemedi', err instanceof Error ? err.message : 'Bir hata oluştu')
    }
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
    
    showSuccess('CSV İndirildi', `${filteredMovements.length} kayıt başarıyla indirildi`)
  }

  // Geri al işlemi
  const handleUndo = async (movement: typeof movements extends (infer T)[] | undefined ? T : never) => {
    if (!movement) return
    
    const actionText = movement.type === 'PURCHASE' ? 'alım' : 'satış'
    const itemName = (movement as any).items?.name || 'Bilinmeyen Ürün'
    
    const confirmed = await confirm({
      type: 'warning',
      title: '↩️ İşlemi Geri Al',
      message: `Bu ${actionText} işlemini geri almak istediğinizden emin misiniz?`,
      details: [
        { label: 'Ürün', value: itemName },
        { label: 'İşlem', value: actionText.charAt(0).toUpperCase() + actionText.slice(1) },
        { label: 'Miktar', value: `${movement.quantity} adet` },
      ],
      confirmText: 'Geri Al',
      cancelText: 'Vazgeç',
    })
    
    if (!confirmed) return
    
    try {
      await undoMovement.mutateAsync({
        movementId: movement.id,
        itemId: movement.item_id,
        type: movement.type,
        quantity: movement.quantity
      })
      showSuccess('İşlem Geri Alındı', `${itemName} için ${actionText} işlemi geri alındı`)
    } catch (err) {
      showError('Geri Alma Başarısız', err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
              📦 Stok Yönetimi
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Fizik tedavi malzemelerinizi kolayca yönetin
            </p>
          </div>
          
          {/* Sekmeler */}
          <div className="flex bg-white rounded-xl p-1.5 border border-[var(--color-border)] shadow-sm">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
              }`}
            >
              📋 Stok
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
              }`}
            >
              📊 Geçmiş
            </button>
          </div>
        </div>

        {/* Arama (sadece stok sekmesinde) */}
        {activeTab === 'inventory' && categories && categories.length > 0 && (
          <div className="relative animate-slide-up">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg 
                className="w-5 h-5 text-[var(--color-text-muted)]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Ürün veya kategori ara..."
              className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-[var(--color-border)] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-lg transition-all"
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
        <div className="animate-slide-up">
          {/* Kategoriler Yükleniyor */}
          {categoriesLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent mb-4"></div>
              <p className="text-[var(--color-text-muted)]">Yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* Kategori Listesi */}
              <div className="grid gap-6">
                {categories && categories.length > 0 ? (
                  categories.map((category, index) => (
                    <div 
                      key={category.id} 
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CategoryCard 
                        category={category} 
                        searchQuery={searchQuery}
                      />
                    </div>
                  ))
                ) : !isAddingCategory ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">Henüz kategori yok</h3>
                    <p className="text-[var(--color-text-muted)] mt-2 mb-6 max-w-sm mx-auto">
                      İlk kategorinizi oluşturarak stok takibine başlayın
                    </p>
                    <button
                      onClick={() => setIsAddingCategory(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
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
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm animate-scale-in">
                  <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                    <span className="text-xl">📁</span>
                    Yeni Kategori Ekle
                  </h3>
                  <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="örn: İğne Uçları, Bandajlar, Elektrotlar..."
                      autoFocus
                      className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-base"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={createCategory.isPending || !newCategoryName.trim()}
                        className="flex-1 sm:flex-none px-6 py-3 font-semibold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {createCategory.isPending ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Ekleniyor...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Ekle
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false)
                          setNewCategoryName('')
                        }}
                        className="px-5 py-3 font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] rounded-xl transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              ) : categories && categories.length > 0 ? (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full py-5 text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/5 rounded-2xl border-2 border-dashed border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-all flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yeni Kategori Ekle
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : (
        /* Geçmiş Sekmesi */
        <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm animate-slide-up">
          <div className="px-5 py-5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-bg)] to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
                  <span>📊</span>
                  Stok Hareket Geçmişi
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {filteredMovements.length} hareket gösteriliyor
                  {dateFilter !== 'all' && ` • ${
                    dateFilter === 'today' ? 'Bugün' : 
                    dateFilter === 'week' ? 'Bu Hafta' : 'Bu Ay'
                  }`}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Tarih Filtreleri */}
                <div className="flex bg-[var(--color-bg)] rounded-xl p-1 text-sm border border-[var(--color-border)]">
                  {[
                    { value: 'all', label: 'Tümü' },
                    { value: 'today', label: 'Bugün' },
                    { value: 'week', label: 'Hafta' },
                    { value: 'month', label: 'Ay' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDateFilter(value as DateFilter)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        dateFilter === value
                          ? 'bg-white shadow-sm text-[var(--color-primary)]'
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
                  className="px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent mb-4"></div>
              <p className="text-[var(--color-text-muted)]">Yükleniyor...</p>
            </div>
          ) : filteredMovements.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {filteredMovements.map((movement, index) => (
                <div 
                  key={movement.id} 
                  className="px-5 py-4 hover:bg-[var(--color-bg)] transition-colors group"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`
                        w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl
                        ${movement.type === 'PURCHASE' 
                          ? 'bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600' 
                          : 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600'
                        }
                      `}>
                        {movement.type === 'PURCHASE' ? '📦' : '💰'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-text)] truncate">
                          {(movement as any).items?.name || 'Bilinmeyen Ürün'}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {movement.type === 'PURCHASE' ? 'Stok Eklendi' : 'Satış Yapıldı'} • {movement.quantity} adet
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold tabular-nums ${
                          movement.type === 'PURCHASE' ? 'text-emerald-600' : 'text-amber-600'
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
                        className="p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        title="Geri Al"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                <span className="text-3xl">📭</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                {dateFilter === 'all' ? 'Henüz geçmiş yok' : 'Bu dönemde hareket yok'}
              </h3>
              <p className="text-[var(--color-text-muted)] mt-2">
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
