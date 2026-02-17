import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      dishes: {
        Row: {
          id: number
          name: string
          price: number
          description: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          description?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          description?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: number
          product: string
          quantity: number
          price: number
          total: number
          paid: number
          balance: number
          customer_name: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          product: string
          quantity: number
          price: number
          total: number
          paid?: number
          balance: number
          customer_name: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          product?: string
          quantity?: number
          price?: number
          total?: number
          paid?: number
          balance?: number
          customer_name?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: number
          sale_id: number
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: number
          sale_id: number
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          sale_id?: number
          amount?: number
          note?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'vendedor' | 'supervisor'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'vendedor' | 'supervisor'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          role?: 'admin' | 'vendedor' | 'supervisor'
          is_active?: boolean
          updated_at?: string
        }
      }
      app_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          value?: string
        }
      }
    }
  }
}
