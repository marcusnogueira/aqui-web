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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          preferred_language: string
          is_vendor: boolean
          active_role: 'customer' | 'vendor'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferred_language?: string
          is_vendor?: boolean
          active_role?: 'customer' | 'vendor'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferred_language?: string
          is_vendor?: boolean
          active_role?: 'customer' | 'vendor'
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          user_id: string
          business_name: string
          description: string | null
          business_type: string | null
          subcategory: string | null
          tags: string[] | null
          profile_image_url: string | null
          banner_image_url: string[] | null
          contact_email: string | null
          phone: string | null
          address: string | null
          average_rating: number | null
          total_reviews: number
          is_active: boolean
          is_approved: boolean
          approved_by: string | null
          approved_at: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          description?: string | null
          business_type?: string | null
          subcategory?: string | null
          tags?: string[] | null
          profile_image_url?: string | null
          banner_image_url?: string[] | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          average_rating?: number | null
          total_reviews?: number
          is_active?: boolean
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          description?: string | null
          business_type?: string | null
          subcategory?: string | null
          tags?: string[] | null
          profile_image_url?: string | null
          banner_image_url?: string | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          average_rating?: number | null
          total_reviews?: number
          is_active?: boolean
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendor_live_sessions: {
        Row: {
          id: string
          vendor_id: string
          latitude: number | null
          longitude: number | null
          address: string | null
          start_time: string
          end_time: string | null
          was_scheduled_duration: number | null
          estimated_customers: number | null
          is_active: boolean
          created_at: string
          auto_end_time: string | null
          ended_by: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          start_time: string
          end_time?: string | null
          was_scheduled_duration?: number | null
          estimated_customers?: number | null
          is_active?: boolean
          created_at?: string
          auto_end_time?: string | null
          ended_by?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          start_time?: string
          end_time?: string | null
          was_scheduled_duration?: number | null
          estimated_customers?: number | null
          is_active?: boolean
          created_at?: string
          auto_end_time?: string | null
          ended_by?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          vendor_id: string
          rating: number
          review: string | null
          created_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          vendor_id: string
          rating: number
          review?: string | null
          created_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          vendor_id?: string
          rating?: number
          review?: string | null
          created_at?: string
          edited_at?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string
          created_at?: string
        }
      }
      search_logs: {
        Row: {
          id: string
          user_id: string | null
          query: string
          filters: Json | null
          latitude: number | null
          longitude: number | null
          vendor_clicked: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          query: string
          filters?: Json | null
          latitude?: number | null
          longitude?: number | null
          vendor_clicked?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          query?: string
          filters?: Json | null
          latitude?: number | null
          longitude?: number | null
          vendor_clicked?: string | null
          created_at?: string
        }
      }
      customer_on_the_way: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id: string
          latitude: number
          longitude: number
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string
          latitude?: number
          longitude?: number
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          username: string
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          password_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          password_hash?: string
          created_at?: string
          updated_at?: string
        }
      }
      vendor_static_locations: {
        Row: {
          id: string
          vendor_id: string
          name: string
          address: string
          latitude: number
          longitude: number
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          address: string
          latitude: number
          longitude: number
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vendor_announcements: {
        Row: {
          id: string
          vendor_id: string
          title: string
          message: string
          is_active: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          title: string
          message: string
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          title?: string
          message?: string
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendor_specials: {
        Row: {
          id: string
          vendor_id: string
          title: string
          description: string
          price: number | null
          original_price: number | null
          is_active: boolean
          starts_at: string
          ends_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          title: string
          description: string
          price?: number | null
          original_price?: number | null
          is_active?: boolean
          starts_at: string
          ends_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          title?: string
          description?: string
          price?: number | null
          original_price?: number | null
          is_active?: boolean
          starts_at?: string
          ends_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      vendor_reports: {
        Row: {
          id: string
          vendor_id: string
          reporter_id: string
          reason: string
          created_at: string
          resolved: boolean
          resolution_notes: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          reporter_id: string
          reason: string
          created_at?: string
          resolved?: boolean
          resolution_notes?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          reporter_id?: string
          reason?: string
          created_at?: string
          resolved?: boolean
          resolution_notes?: string | null
        }
      }
      vendor_feedback: {
        Row: {
          id: string
          vendor_id: string
          message: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          message: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          message?: string
          status?: string
          created_at?: string
        }
      }
      vendor_hours: {
        Row: {
          id: string
          vendor_id: string
          weekday: number
          open_time: string | null
          close_time: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          weekday: number
          open_time?: string | null
          close_time?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          weekday?: number
          open_time?: string | null
          close_time?: string | null
        }
      }
      review_reports: {
        Row: {
          id: string
          review_id: string
          reporter_id: string
          reason: string
          created_at: string
          resolved: boolean
        }
        Insert: {
          id?: string
          review_id: string
          reporter_id: string
          reason: string
          created_at?: string
          resolved?: boolean
        }
        Update: {
          id?: string
          review_id?: string
          reporter_id?: string
          reason?: string
          created_at?: string
          resolved?: boolean
        }
      }
      moderation_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string
          target_id?: string
          reason?: string | null
          created_at?: string
        }
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string | null
          updated_at?: string
        }
      }
      analytics_exports: {
        Row: {
          id: string
          admin_id: string
          export_type: string
          file_path: string
          status: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          admin_id: string
          export_type: string
          file_path: string
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          admin_id?: string
          export_type?: string
          file_path?: string
          status?: string
          created_at?: string
          completed_at?: string | null
        }
      }
      customer_reports: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string
          reason: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
          reviewed_by: string | null
          admin_notes: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id: string
          reason: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          reviewed_by?: string | null
          admin_notes?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string
          reason?: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          reviewed_by?: string | null
          admin_notes?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}