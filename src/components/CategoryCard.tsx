import { useState, useEffect } from 'react'
import type { Category } from '../types/database'
import { useDeleteCategory, useUpdateCategory } from '../hooks/useCategories'
import { ItemList } from './ItemList'
import { useNotification } from '../contexts/NotificationContext'

interface CategoryCardProps {
  category: Category
  searchQuery?: string
}

export function CategoryCard({ category, searchQuery = '' }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const deleteCategory = useDeleteCategory()
  const updateCategory = useUpdateCategory()
  const { showSuccess, showError, confirm } = useNotification()

  // Arama yapıldığında otomatik aç
  useEffect(() => {
    if (searchQuery) {
      setIsExpanded(true)
    }
  }, [searchQuery])

  const handleDelete = async () => {
    const confirmed = await confirm({
      type: 'danger',
      title: '🗑️ Kategori Silme',
      message: 'Bu kategori ve içindeki TÜM ürünler silinecek. Bu işlem geri alınamaz!',
      details: [
        { label: 'Kategori', value: category.name },
      ],
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
    })

    if (confirmed) {
      try {
        await deleteCategory.mutateAsync(category.id)
        showSuccess('Kategori Silindi', `"${category.name}" ve tüm ürünleri silindi`)
      } catch (err) {
        showError('Silme Başarısız', err instanceof Error ? err.message : 'Bir hata oluştu')
      }
    }
  }

  const handleEdit = () => {
    setEditName(category.name)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editName.trim() || editName.trim() === category.name) {
      setIsEditing(false)
      return
    }

    try {
      await updateCategory.mutateAsync({ 
        categoryId: category.id, 
        name: editName.trim() 
      })
      showSuccess('Kategori Güncellendi', `Yeni ad: "${editName.trim()}"`)
      setIsEditing(false)
    } catch (err) {
      showError('Güncelleme Başarısız', err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(category.name)
    }
  }

  const isDisabled = deleteCategory.isPending || updateCategory.isPending

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 card-hover">
      {/* Kategori Başlığı */}
      <div className="px-5 py-4 bg-gradient-to-r from-[var(--color-primary)]/5 via-[var(--color-primary)]/3 to-transparent border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 flex items-center justify-center hover:from-[var(--color-primary)]/30 hover:to-[var(--color-primary)]/10 transition-all group"
            >
              <svg 
                className={`w-5 h-5 text-[var(--color-primary)] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} group-hover:scale-110`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                autoFocus
                className="flex-1 px-4 py-2 text-lg font-semibold rounded-xl border-2 border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
              />
            ) : (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-left flex-1 min-w-0"
              >
                <h3 className="text-lg font-bold text-[var(--color-text)] truncate flex items-center gap-2">
                  <span className="text-xl">📁</span>
                  {category.name}
                </h3>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                onClick={handleEdit}
                disabled={isDisabled}
                className="p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-all disabled:opacity-50"
                title="Düzenle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDisabled}
              className="p-2.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
              title="Sil"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Ürün Listesi */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5">
          <ItemList categoryId={category.id} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  )
}
