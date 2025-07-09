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
      admin_users: {
        Row: {
          id: string
          email: string
          username: string
          password_hash: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username: string
          password_hash: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          password_hash?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      analytics_exports: {
        Row: {
          id: string
          admin_id: string | null
          vendor_id: string | null
          export_type: string | null
          created_at: string | null
          status: string | null
          download_url: string | null
        }
        Insert: {
          id?: string
          admin_id?: string | null
          vendor_id?: string | null
          export_type?: string | null
          created_at?: string | null
          status?: string | null
          download_url?: string | null
        }
        Update: {
          id?: string
          admin_id?: string | null
          vendor_id?: string | null
          export_type?: string | null
          created_at?: string | null
          status?: string | null
          download_url?: string | null
        }
      }
      customer_on_the_way: {
        Row: {
          id: string
          vendor_id: string | null
          user_id: string | null
          clicked_at: string | null
          customer_latitude: number | null
          customer_longitude: number | null
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          user_id?: string | null
          clicked_at?: string | null
          customer_latitude?: number | null
          customer_longitude?: number | null
        }
        Update: {
          id?: string
          vendor_id?: string | null
          user_id?: string | null
          clicked_at?: string | null
          customer_latitude?: number | null
          customer_longitude?: number | null
        }
      }
      customer_reports: {
        Row: {
          id: string
          reporter_id: string | null
          vendor_id: string | null
          issue: string | null
          created_at: string | null
          resolved: boolean | null
          resolution_notes: string | null
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          vendor_id?: string | null
          issue?: string | null
          created_at?: string | null
          resolved?: boolean | null
          resolution_notes?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string | null
          vendor_id?: string | null
          issue?: string | null
          created_at?: string | null
          resolved?: boolean | null
          resolution_notes?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string
          created_at?: string | null
        }
      }
      geography_columns: {
        Row: {
          f_table_catalog: string | null
          f_table_schema: string | null
          f_table_name: string | null
          f_geography_column: string | null
          coord_dimension: number | null
          srid: number | null
          type: string | null
        }
        Insert: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geography_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geography_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
      }
      geometry_columns: {
        Row: {
          f_table_catalog: string | null
          f_table_schema: string | null
          f_table_name: string | null
          f_geometry_column: string | null
          coord_dimension: number | null
          srid: number | null
          type: string | null
        }
        Insert: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geometry_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          f_table_catalog?: string | null
          f_table_schema?: string | null
          f_table_name?: string | null
          f_geometry_column?: string | null
          coord_dimension?: number | null
          srid?: number | null
          type?: string | null
        }
      }
      moderation_logs: {
        Row: {
          id: string
          admin_id: string | null
          vendor_id: string | null
          action: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          admin_id?: string | null
          vendor_id?: string | null
          action?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          admin_id?: string | null
          vendor_id?: string | null
          action?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      platform_settings: {
        Row: {
          id: boolean
          allow_auto_vendor_approval: boolean | null
          maintenance_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          id: boolean
          allow_auto_vendor_approval?: boolean | null
          maintenance_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: boolean
          allow_auto_vendor_approval?: boolean | null
          maintenance_mode?: boolean | null
          updated_at?: string | null
        }
      }
      review_reports: {
        Row: {
          id: string
          review_id: string | null
          vendor_id: string | null
          reason: string | null
          created_at: string | null
          resolved: boolean | null
        }
        Insert: {
          id?: string
          review_id?: string | null
          vendor_id?: string | null
          reason?: string | null
          created_at?: string | null
          resolved?: boolean | null
        }
        Update: {
          id?: string
          review_id?: string | null
          vendor_id?: string | null
          reason?: string | null
          created_at?: string | null
          resolved?: boolean | null
        }
      }
      reviews: {
        Row: {
          id: string
          vendor_id: string | null
          user_id: string | null
          rating: number | null
          review: string | null
          created_at: string | null
          edited_at: string | null
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          user_id?: string | null
          rating?: number | null
          review?: string | null
          created_at?: string | null
          edited_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string | null
          user_id?: string | null
          rating?: number | null
          review?: string | null
          created_at?: string | null
          edited_at?: string | null
        }
      }
      search_logs: {
        Row: {
          id: string
          user_id: string | null
          search_query: string | null
          filters: Json | null
          location: unknown | null
          searched_at: string | null
          vendor_clicked: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          search_query?: string | null
          filters?: Json | null
          location?: unknown | null
          searched_at?: string | null
          vendor_clicked?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          search_query?: string | null
          filters?: Json | null
          location?: unknown | null
          searched_at?: string | null
          vendor_clicked?: string | null
        }
      }
      spatial_ref_sys: {
        Row: {
          srid: number
          auth_name: string | null
          auth_srid: number | null
          srtext: string | null
          proj4text: string | null
        }
        Insert: {
          srid: number
          auth_name?: string | null
          auth_srid?: number | null
          srtext?: string | null
          proj4text?: string | null
        }
        Update: {
          srid?: number
          auth_name?: string | null
          auth_srid?: number | null
          srtext?: string | null
          proj4text?: string | null
        }
      }
      users: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          is_vendor: boolean | null
          is_admin: boolean | null
          active_role: string | null
          created_at: string | null
          email: string | null
          phone: string | null
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          is_vendor?: boolean | null
          is_admin?: boolean | null
          active_role?: string | null
          created_at?: string | null
          email?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          is_vendor?: boolean | null
          is_admin?: boolean | null
          active_role?: string | null
          created_at?: string | null
          email?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
      }
      vendor_announcements: {
        Row: {
          id: string
          vendor_id: string | null
          message: string | null
          image_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          message?: string | null
          image_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string | null
          message?: string | null
          image_url?: string | null
          created_at?: string | null
        }
      }
      vendor_feedback: {
        Row: {
          id: string
          vendor_id: string | null
          message: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          message?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string | null
          message?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      vendor_hours: {
        Row: {
          id: number
          vendor_id: string | null
          weekday: number | null
          open_time: string | null
          close_time: string | null
        }
        Insert: {
          id?: number
          vendor_id?: string | null
          weekday?: number | null
          open_time?: string | null
          close_time?: string | null
        }
        Update: {
          id?: number
          vendor_id?: string | null
          weekday?: number | null
          open_time?: string | null
          close_time?: string | null
        }
      }
      vendor_live_sessions: {
        Row: {
          id: string
          vendor_id: string | null
          start_time: string
          end_time: string | null
          was_scheduled_duration: number | null
          estimated_customers: number | null
          latitude: number | null
          longitude: number | null
          address: string | null
          is_active: boolean | null
          created_at: string | null
          auto_end_time: string | null
          ended_by: string | null
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          start_time: string
          end_time?: string | null
          was_scheduled_duration?: number | null
          estimated_customers?: number | null
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          auto_end_time?: string | null
          ended_by?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string | null
          start_time?: string
          end_time?: string | null
          was_scheduled_duration?: number | null
          estimated_customers?: number | null
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          auto_end_time?: string | null
          ended_by?: string | null
        }
      }
      vendor_reports: {
        Row: {
          id: string
          vendor_id: string
          reporter_id: string
          reason: string
          created_at: string | null
          resolved: boolean | null
          resolution_notes: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          reporter_id: string
          reason: string
          created_at?: string | null
          resolved?: boolean | null
          resolution_notes?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          reporter_id?: string
          reason?: string
          created_at?: string | null
          resolved?: boolean | null
          resolution_notes?: string | null
        }
      }
      vendor_specials: {
        Row: {
          id: string
          vendor_id: string | null
          title: string | null
          description: string | null
          image_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          created_at?: string | null
        }
      }
      vendor_static_locations: {
        Row: {
          id: number
          vendor_id: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: number
          vendor_id?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: number
          vendor_id?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
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
          is_active: boolean | null
          is_approved: boolean | null
          approved_by: string | null
          approved_at: string | null
          created_at: string | null
          updated_at: string | null
          average_rating: number | null
          total_reviews: number | null
          admin_notes: string | null
          latitude: number | null
          longitude: number | null
          city: string | null
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
          is_active?: boolean | null
          is_approved?: boolean | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          average_rating?: number | null
          total_reviews?: number | null
          admin_notes?: string | null
          latitude?: number | null
          longitude?: number | null
          city?: string | null
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
          banner_image_url?: string[] | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          average_rating?: number | null
          total_reviews?: number | null
          admin_notes?: string | null
          latitude?: number | null
          longitude?: number | null
          city?: string | null
        }
      }
      vendors_old: {
        Row: {
          id: string
          business_name: string
          description: string | null
          business_type: string | null
          cuisine_type: string | null
          tags: string[] | null
          profile_image_url: string | null
          banner_image_url: string[] | null
          contact_email: string | null
          is_active: boolean | null
          is_approved: boolean | null
          approved_by: string | null
          approved_at: string | null
          created_at: string | null
          address: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          business_name: string
          description?: string | null
          business_type?: string | null
          cuisine_type?: string | null
          tags?: string[] | null
          profile_image_url?: string | null
          banner_image_url?: string[] | null
          contact_email?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          address?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_name?: string
          description?: string | null
          business_type?: string | null
          cuisine_type?: string | null
          tags?: string[] | null
          profile_image_url?: string | null
          banner_image_url?: string[] | null
          contact_email?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          address?: string | null
          phone?: string | null
          updated_at?: string | null
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
