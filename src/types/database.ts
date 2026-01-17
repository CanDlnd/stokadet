export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          category_id: string
          name: string
          stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          stock?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          name?: string
          stock?: number
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          user_id: string
          item_id: string
          type: 'PURCHASE' | 'SALE'
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          type: 'PURCHASE' | 'SALE'
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          type?: 'PURCHASE' | 'SALE'
          quantity?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      movement_type: 'PURCHASE' | 'SALE'
    }
  }
}

// Helper types
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type Item = Database['public']['Tables']['items']['Row']
export type ItemInsert = Database['public']['Tables']['items']['Insert']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']
export type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert']
