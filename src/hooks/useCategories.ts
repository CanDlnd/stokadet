import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Category, CategoryInsert } from '../types/database'

export function useCategories() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Oturum açılmamış')
      
      const category: CategoryInsert = {
        name,
        user_id: user.id,
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, name }: { categoryId: string; name: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', categoryId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
