export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      watchlist: {
        Row: {
          id: string
          created_at: string
          user_id: string
          keyword: string
          max_price: number
          min_price: number
          zip: string
          radius: number
          marketplace: string
          category: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          keyword: string
          max_price: number
          min_price?: number
          zip: string
          radius?: number
          marketplace?: string
          category?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          keyword?: string
          max_price?: number
          min_price?: number
          zip?: string
          radius?: number
          marketplace?: string
          category?: string
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
      [_ in never]: never
    }
  }
}
