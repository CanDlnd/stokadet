import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Build sırasında env değişkenleri olmayabilir, bu yüzden boş string ile devam et
// Runtime'da kontrol edilecek
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Runtime'da env değişkenlerini kontrol et
export function checkSupabaseConfig(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.')
    return false
  }
  return true
}
