import { useState, useMemo } from 'react'
import { useItems, useCreateItem, useUpdateItem } from '../hooks/useItems'
import { ItemRow } from './ItemRow'
import type { Item } from '../types/database'

interface ItemListProps {
  categoryId: string
  searchQuery?: string
  categoryMatched?: boolean // Kategori adı eşleşti mi?
}

export function ItemList({ categoryId, searchQuery = '', categoryMatched = false }: ItemListProps) {
  const { data: items, isLoading } = useItems(categoryId)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const [newItemName, setNewItemName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editName, setEditName] = useState('')

  // Arama filtresi
  const filteredItems = useMemo(() => {
    if (!items) return []
    
    // Arama yok veya kategori adı eşleşti -> tüm ürünleri göster
    if (!searchQuery.trim() || categoryMatched) {
      return items
    }
    
    // Sadece ürün adına göre filtrele
    const query = searchQuery.toLowerCase().trim()
    return items.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }, [items, searchQuery, categoryMatched])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    try {
      await createItem.mutateAsync({ name: newItemName.trim(), categoryId })
      setNewItemName('')
      setIsAdding(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ürün eklenemedi')
    }
  }

  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setEditName(item.name)
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) {
      setEditingItem(null)
      return
    }

    if (editName.trim() === editingItem.name) {
      setEditingItem(null)
      return
    }

    try {
      await updateItem.mutateAsync({ 
        itemId: editingItem.id, 
        name: editName.trim() 
      })
      setEditingItem(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Güncelleme başarısız')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Ürünler */}
      {filteredItems.length > 0 ? (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <ItemRow 
              key={item.id} 
              item={item} 
              onEdit={handleEditItem}
            />
          ))}
        </div>
      ) : (
        <p className="text-[var(--color-text-muted)] text-sm text-center py-4">
          {searchQuery && !categoryMatched 
            ? 'Arama sonucu bulunamadı' 
            : 'Bu kategoride henüz ürün yok'
          }
        </p>
      )}

      {/* Ürün Ekleme Formu - Arama yokken göster */}
      {!searchQuery && (
        <>
          {isAdding ? (
            <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2 mt-4">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ürün adını girin..."
                autoFocus
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createItem.isPending || !newItemName.trim()}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
                >
                  {createItem.isPending ? 'Ekleniyor...' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false)
                    setNewItemName('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-lg border border-dashed border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ürün Ekle
            </button>
          )}
        </>
      )}

      {/* Düzenleme Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingItem(null)}>
          <div 
            className="bg-[var(--color-surface)] rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <span>✏️</span>
              Ürün Düzenle
            </h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') setEditingItem(null)
              }}
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateItem.isPending || !editName.trim()}
                className="px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
              >
                {updateItem.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
