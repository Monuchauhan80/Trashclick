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
      complaints: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          description: string
          location: string
          latitude: string | null
          longitude: string | null
          image_url: string | null
          status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          description: string
          location: string
          latitude?: string | null
          longitude?: string | null
          image_url?: string | null
          status?: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          description?: string
          location?: string
          latitude?: string | null
          longitude?: string | null
          image_url?: string | null
          status?: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          user_id?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          email: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          email?: string
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