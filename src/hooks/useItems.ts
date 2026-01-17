import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Item, ItemInsert, StockMovementInsert } from '../types/database'

export function useItems(categoryId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['items', categoryId, user?.id],
    queryFn: async (): Promise<Item[]> => {
      let query = supabase.from('items').select('*').order('name')
      
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ name, categoryId }: { name: string; categoryId: string }) => {
      if (!user) throw new Error('Oturum açılmamış')
      
      const item: ItemInsert = {
        name,
        category_id: categoryId,
        user_id: user.id,
        stock: 0,
      }
      
      const { data, error } = await supabase
        .from('items')
        .insert(item)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, name }: { itemId: string; name: string }) => {
      const { data, error } = await supabase
        .from('items')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateStock() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
      type,
      currentStock,
    }: {
      itemId: string
      quantity: number
      type: 'PURCHASE' | 'SALE'
      currentStock: number
    }) => {
      if (!user) throw new Error('Oturum açılmamış')
      
      const newStock = type === 'PURCHASE' 
        ? currentStock + quantity 
        : currentStock - quantity
      
      if (newStock < 0) {
        throw new Error('Stok 0\'ın altına düşemez')
      }
      
      // Ürün stokunu güncelle
      const { error: itemError } = await supabase
        .from('items')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      
      if (itemError) throw itemError
      
      // Stok hareketi kaydı oluştur
      const movement: StockMovementInsert = {
        item_id: itemId,
        user_id: user.id,
        type,
        quantity,
      }
      
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(movement)
      
      if (movementError) throw movementError
      
      return { newStock }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
    },
  })
}

// Geri al işlemi - ters hareket oluşturur
export function useUndoStockMovement() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      movementId,
      itemId,
      type,
      quantity,
    }: {
      movementId: string
      itemId: string
      type: 'PURCHASE' | 'SALE'
      quantity: number
    }) => {
      if (!user) throw new Error('Oturum açılmamış')
      
      // Önce mevcut stoku al
      const { data: item, error: itemFetchError } = await supabase
        .from('items')
        .select('stock')
        .eq('id', itemId)
        .single()
      
      if (itemFetchError) throw itemFetchError
      if (!item) throw new Error('Ürün bulunamadı')
      
      // Ters işlem yap: PURCHASE ise çıkar, SALE ise ekle
      const reverseType = type === 'PURCHASE' ? 'SALE' : 'PURCHASE'
      const newStock = reverseType === 'PURCHASE' 
        ? item.stock + quantity 
        : item.stock - quantity
      
      if (newStock < 0) {
        throw new Error('Geri alma işlemi başarısız: Stok negatif olamaz')
      }
      
      // Stoku güncelle
      const { error: itemError } = await supabase
        .from('items')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      
      if (itemError) throw itemError
      
      // Ters hareket kaydı oluştur
      const movement: StockMovementInsert = {
        item_id: itemId,
        user_id: user.id,
        type: reverseType,
        quantity,
      }
      
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(movement)
      
      if (movementError) throw movementError
      
      return { newStock, reversedMovementId: movementId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
    },
  })
}

export function useStockMovements(itemId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['stock_movements', itemId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*, items(name)')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (itemId) {
        query = query.eq('item_id', itemId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}
