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
      audit_log_entries: {
        Row: {
          instance_id: string | null
          id: string
          payload: Json | null
          created_at: string | null
          ip_address: string
        }
        Insert: {
          instance_id?: string | null
          id: string
          payload?: Json | null
          created_at?: string | null
          ip_address?: string
        }
        Update: {
          instance_id?: string | null
          id?: string
          payload?: Json | null
          created_at?: string | null
          ip_address?: string
        }
      }
      buckets: {
        Row: {
          id: string
          name: string
          owner: string | null
          created_at: string | null
          updated_at: string | null
          public: boolean | null
          avif_autodetection: boolean | null
          file_size_limit: number | null
          allowed_mime_types: string[] | null
          owner_id: string | null
        }
        Insert: {
          id: string
          name: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          public?: boolean | null
          avif_autodetection?: boolean | null
          file_size_limit?: number | null
          allowed_mime_types?: string[] | null
          owner_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          public?: boolean | null
          avif_autodetection?: boolean | null
          file_size_limit?: number | null
          allowed_mime_types?: string[] | null
          owner_id?: string | null
        }
      }
      business_subcategories: {
        Row: {
          id: string
          name: string
          business_type_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          business_type_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          business_type_id?: string
          created_at?: string | null
        }
      }
      business_types: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
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
      decrypted_secrets: {
        Row: {
          id: string | null
          name: string | null
          description: string | null
          secret: string | null
          decrypted_secret: string | null
          key_id: string | null
          nonce: unknown | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          secret?: string | null
          decrypted_secret?: string | null
          key_id?: string | null
          nonce?: unknown | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          secret?: string | null
          decrypted_secret?: string | null
          key_id?: string | null
          nonce?: unknown | null
          created_at?: string | null
          updated_at?: string | null
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
      flow_state: {
        Row: {
          id: string
          user_id: string | null
          auth_code: string
          code_challenge_method: unknown
          code_challenge: string
          provider_type: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          created_at: string | null
          updated_at: string | null
          authentication_method: string
          auth_code_issued_at: string | null
        }
        Insert: {
          id: string
          user_id?: string | null
          auth_code: string
          code_challenge_method: unknown
          code_challenge: string
          provider_type: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          created_at?: string | null
          updated_at?: string | null
          authentication_method: string
          auth_code_issued_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          auth_code?: string
          code_challenge_method?: unknown
          code_challenge?: string
          provider_type?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          created_at?: string | null
          updated_at?: string | null
          authentication_method?: string
          auth_code_issued_at?: string | null
        }
      }
      identities: {
        Row: {
          provider_id: string
          user_id: string
          identity_data: Json
          provider: string
          last_sign_in_at: string | null
          created_at: string | null
          updated_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          provider_id: string
          user_id: string
          identity_data: Json
          provider: string
          last_sign_in_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          id?: string
        }
        Update: {
          provider_id?: string
          user_id?: string
          identity_data?: Json
          provider?: string
          last_sign_in_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          id?: string
        }
      }
      instances: {
        Row: {
          id: string
          uuid: string | null
          raw_base_config: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          uuid?: string | null
          raw_base_config?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          uuid?: string | null
          raw_base_config?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      live_vendors_with_sessions: {
        Row: {
          id: string | null
          user_id: string | null
          business_name: string | null
          description: string | null
          business_type: string | null
          subcategory: string | null
          tags: string[] | null
          profile_image_url: string | null
          banner_image_url: string[] | null
          contact_email: string | null
          phone: string | null
          address: string | null
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
          status: unknown | null
          rejection_reason: string | null
          subcategory__other: string | null
          session_id: string | null
          start_time: string | null
          end_time: string | null
          is_active: boolean | null
          live_latitude: number | null
          live_longitude: number | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          business_name?: string | null
          description?: string | null
          business_type?: string | null
          subcategory?: string | null
          tags?: string[] | null
          profile_image_url?: string | null
          banner_image_url?: string[] | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
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
          status?: unknown | null
          rejection_reason?: string | null
          subcategory__other?: string | null
          session_id?: string | null
          start_time?: string | null
          end_time?: string | null
          is_active?: boolean | null
          live_latitude?: number | null
          live_longitude?: number | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          business_name?: string | null
          description?: string | null
          business_type?: string | null
          subcategory?: string | null
          tags?: string[] | null
          profile_image_url?: string | null
          banner_image_url?: string[] | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
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
          status?: unknown | null
          rejection_reason?: string | null
          subcategory__other?: string | null
          session_id?: string | null
          start_time?: string | null
          end_time?: string | null
          is_active?: boolean | null
          live_latitude?: number | null
          live_longitude?: number | null
        }
      }
      messages: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      messages_2025_07_09: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      messages_2025_07_10: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      messages_2025_07_11: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      messages_2025_07_12: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      messages_2025_07_13: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      messages_2025_07_14: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      messages_2025_07_15: {
        Row: {
          topic: string
          extension: string
          payload: Json | null
          event: string | null
          private: boolean | null
          updated_at: string
          inserted_at: string
          id: string
        }
        Insert: {
          topic: string
          extension: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
        Update: {
          topic?: string
          extension?: string
          payload?: Json | null
          event?: string | null
          private?: boolean | null
          updated_at?: string
          inserted_at?: string
          id?: string
        }
      }
      mfa_amr_claims: {
        Row: {
          session_id: string
          created_at: string
          updated_at: string
          authentication_method: string
          id: string
        }
        Insert: {
          session_id: string
          created_at: string
          updated_at: string
          authentication_method: string
          id: string
        }
        Update: {
          session_id?: string
          created_at?: string
          updated_at?: string
          authentication_method?: string
          id?: string
        }
      }
      mfa_challenges: {
        Row: {
          id: string
          factor_id: string
          created_at: string
          verified_at: string | null
          ip_address: unknown
          otp_code: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          id: string
          factor_id: string
          created_at: string
          verified_at?: string | null
          ip_address: unknown
          otp_code?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          id?: string
          factor_id?: string
          created_at?: string
          verified_at?: string | null
          ip_address?: unknown
          otp_code?: string | null
          web_authn_session_data?: Json | null
        }
      }
      mfa_factors: {
        Row: {
          id: string
          user_id: string
          friendly_name: string | null
          factor_type: unknown
          status: unknown
          created_at: string
          updated_at: string
          secret: string | null
          phone: string | null
          last_challenged_at: string | null
          web_authn_credential: Json | null
          web_authn_aaguid: string | null
        }
        Insert: {
          id: string
          user_id: string
          friendly_name?: string | null
          factor_type: unknown
          status: unknown
          created_at: string
          updated_at: string
          secret?: string | null
          phone?: string | null
          last_challenged_at?: string | null
          web_authn_credential?: Json | null
          web_authn_aaguid?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          friendly_name?: string | null
          factor_type?: unknown
          status?: unknown
          created_at?: string
          updated_at?: string
          secret?: string | null
          phone?: string | null
          last_challenged_at?: string | null
          web_authn_credential?: Json | null
          web_authn_aaguid?: string | null
        }
      }
      migrations: {
        Row: {
          id: number
          name: string
          hash: string
          executed_at: string | null
        }
        Insert: {
          id: number
          name: string
          hash: string
          executed_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          hash?: string
          executed_at?: string | null
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
          priority: unknown | null
        }
        Insert: {
          id?: string
          admin_id?: string | null
          vendor_id?: string | null
          action?: string | null
          notes?: string | null
          created_at?: string | null
          priority?: unknown | null
        }
        Update: {
          id?: string
          admin_id?: string | null
          vendor_id?: string | null
          action?: string | null
          notes?: string | null
          created_at?: string | null
          priority?: unknown | null
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string | null
          type: unknown
          message: string
          link: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          recipient_id?: string | null
          type: unknown
          message: string
          link?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          recipient_id?: string | null
          type?: unknown
          message?: string
          link?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
      }
      objects: {
        Row: {
          id: string
          bucket_id: string | null
          name: string | null
          owner: string | null
          created_at: string | null
          updated_at: string | null
          last_accessed_at: string | null
          metadata: Json | null
          path_tokens: string[] | null
          version: string | null
          owner_id: string | null
          user_metadata: Json | null
        }
        Insert: {
          id?: string
          bucket_id?: string | null
          name?: string | null
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
          path_tokens?: string[] | null
          version?: string | null
          owner_id?: string | null
          user_metadata?: Json | null
        }
        Update: {
          id?: string
          bucket_id?: string | null
          name?: string | null
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
          path_tokens?: string[] | null
          version?: string | null
          owner_id?: string | null
          user_metadata?: Json | null
        }
      }
      one_time_tokens: {
        Row: {
          id: string
          user_id: string
          token_type: unknown
          token_hash: string
          relates_to: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          token_type: unknown
          token_hash: string
          relates_to: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_type?: unknown
          token_hash?: string
          relates_to?: string
          created_at?: string
          updated_at?: string
        }
      }
      pg_stat_statements: {
        Row: {
          userid: unknown | null
          dbid: unknown | null
          toplevel: boolean | null
          queryid: number | null
          query: string | null
          plans: number | null
          total_plan_time: number | null
          min_plan_time: number | null
          max_plan_time: number | null
          mean_plan_time: number | null
          stddev_plan_time: number | null
          calls: number | null
          total_exec_time: number | null
          min_exec_time: number | null
          max_exec_time: number | null
          mean_exec_time: number | null
          stddev_exec_time: number | null
          rows: number | null
          shared_blks_hit: number | null
          shared_blks_read: number | null
          shared_blks_dirtied: number | null
          shared_blks_written: number | null
          local_blks_hit: number | null
          local_blks_read: number | null
          local_blks_dirtied: number | null
          local_blks_written: number | null
          temp_blks_read: number | null
          temp_blks_written: number | null
          shared_blk_read_time: number | null
          shared_blk_write_time: number | null
          local_blk_read_time: number | null
          local_blk_write_time: number | null
          temp_blk_read_time: number | null
          temp_blk_write_time: number | null
          wal_records: number | null
          wal_fpi: number | null
          wal_bytes: number | null
          jit_functions: number | null
          jit_generation_time: number | null
          jit_inlining_count: number | null
          jit_inlining_time: number | null
          jit_optimization_count: number | null
          jit_optimization_time: number | null
          jit_emission_count: number | null
          jit_emission_time: number | null
          jit_deform_count: number | null
          jit_deform_time: number | null
          stats_since: string | null
          minmax_stats_since: string | null
        }
        Insert: {
          userid?: unknown | null
          dbid?: unknown | null
          toplevel?: boolean | null
          queryid?: number | null
          query?: string | null
          plans?: number | null
          total_plan_time?: number | null
          min_plan_time?: number | null
          max_plan_time?: number | null
          mean_plan_time?: number | null
          stddev_plan_time?: number | null
          calls?: number | null
          total_exec_time?: number | null
          min_exec_time?: number | null
          max_exec_time?: number | null
          mean_exec_time?: number | null
          stddev_exec_time?: number | null
          rows?: number | null
          shared_blks_hit?: number | null
          shared_blks_read?: number | null
          shared_blks_dirtied?: number | null
          shared_blks_written?: number | null
          local_blks_hit?: number | null
          local_blks_read?: number | null
          local_blks_dirtied?: number | null
          local_blks_written?: number | null
          temp_blks_read?: number | null
          temp_blks_written?: number | null
          shared_blk_read_time?: number | null
          shared_blk_write_time?: number | null
          local_blk_read_time?: number | null
          local_blk_write_time?: number | null
          temp_blk_read_time?: number | null
          temp_blk_write_time?: number | null
          wal_records?: number | null
          wal_fpi?: number | null
          wal_bytes?: number | null
          jit_functions?: number | null
          jit_generation_time?: number | null
          jit_inlining_count?: number | null
          jit_inlining_time?: number | null
          jit_optimization_count?: number | null
          jit_optimization_time?: number | null
          jit_emission_count?: number | null
          jit_emission_time?: number | null
          jit_deform_count?: number | null
          jit_deform_time?: number | null
          stats_since?: string | null
          minmax_stats_since?: string | null
        }
        Update: {
          userid?: unknown | null
          dbid?: unknown | null
          toplevel?: boolean | null
          queryid?: number | null
          query?: string | null
          plans?: number | null
          total_plan_time?: number | null
          min_plan_time?: number | null
          max_plan_time?: number | null
          mean_plan_time?: number | null
          stddev_plan_time?: number | null
          calls?: number | null
          total_exec_time?: number | null
          min_exec_time?: number | null
          max_exec_time?: number | null
          mean_exec_time?: number | null
          stddev_exec_time?: number | null
          rows?: number | null
          shared_blks_hit?: number | null
          shared_blks_read?: number | null
          shared_blks_dirtied?: number | null
          shared_blks_written?: number | null
          local_blks_hit?: number | null
          local_blks_read?: number | null
          local_blks_dirtied?: number | null
          local_blks_written?: number | null
          temp_blks_read?: number | null
          temp_blks_written?: number | null
          shared_blk_read_time?: number | null
          shared_blk_write_time?: number | null
          local_blk_read_time?: number | null
          local_blk_write_time?: number | null
          temp_blk_read_time?: number | null
          temp_blk_write_time?: number | null
          wal_records?: number | null
          wal_fpi?: number | null
          wal_bytes?: number | null
          jit_functions?: number | null
          jit_generation_time?: number | null
          jit_inlining_count?: number | null
          jit_inlining_time?: number | null
          jit_optimization_count?: number | null
          jit_optimization_time?: number | null
          jit_emission_count?: number | null
          jit_emission_time?: number | null
          jit_deform_count?: number | null
          jit_deform_time?: number | null
          stats_since?: string | null
          minmax_stats_since?: string | null
        }
      }
      pg_stat_statements_info: {
        Row: {
          dealloc: number | null
          stats_reset: string | null
        }
        Insert: {
          dealloc?: number | null
          stats_reset?: string | null
        }
        Update: {
          dealloc?: number | null
          stats_reset?: string | null
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
          id?: boolean
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
      refresh_tokens: {
        Row: {
          instance_id: string | null
          id: number
          token: string | null
          user_id: string | null
          revoked: boolean | null
          created_at: string | null
          updated_at: string | null
          parent: string | null
          session_id: string | null
        }
        Insert: {
          instance_id?: string | null
          id?: number
          token?: string | null
          user_id?: string | null
          revoked?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          parent?: string | null
          session_id?: string | null
        }
        Update: {
          instance_id?: string | null
          id?: number
          token?: string | null
          user_id?: string | null
          revoked?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          parent?: string | null
          session_id?: string | null
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
      s3_multipart_uploads: {
        Row: {
          id: string
          in_progress_size: number
          upload_signature: string
          bucket_id: string
          key: string
          version: string
          owner_id: string | null
          created_at: string
          user_metadata: Json | null
        }
        Insert: {
          id: string
          in_progress_size?: number
          upload_signature: string
          bucket_id: string
          key: string
          version: string
          owner_id?: string | null
          created_at?: string
          user_metadata?: Json | null
        }
        Update: {
          id?: string
          in_progress_size?: number
          upload_signature?: string
          bucket_id?: string
          key?: string
          version?: string
          owner_id?: string | null
          created_at?: string
          user_metadata?: Json | null
        }
      }
      s3_multipart_uploads_parts: {
        Row: {
          id: string
          upload_id: string
          size: number
          part_number: number
          bucket_id: string
          key: string
          etag: string
          owner_id: string | null
          version: string
          created_at: string
        }
        Insert: {
          id?: string
          upload_id: string
          size?: number
          part_number: number
          bucket_id: string
          key: string
          etag: string
          owner_id?: string | null
          version: string
          created_at?: string
        }
        Update: {
          id?: string
          upload_id?: string
          size?: number
          part_number?: number
          bucket_id?: string
          key?: string
          etag?: string
          owner_id?: string | null
          version?: string
          created_at?: string
        }
      }
      saml_providers: {
        Row: {
          id: string
          sso_provider_id: string
          entity_id: string
          metadata_xml: string
          metadata_url: string | null
          attribute_mapping: Json | null
          created_at: string | null
          updated_at: string | null
          name_id_format: string | null
        }
        Insert: {
          id: string
          sso_provider_id: string
          entity_id: string
          metadata_xml: string
          metadata_url?: string | null
          attribute_mapping?: Json | null
          created_at?: string | null
          updated_at?: string | null
          name_id_format?: string | null
        }
        Update: {
          id?: string
          sso_provider_id?: string
          entity_id?: string
          metadata_xml?: string
          metadata_url?: string | null
          attribute_mapping?: Json | null
          created_at?: string | null
          updated_at?: string | null
          name_id_format?: string | null
        }
      }
      saml_relay_states: {
        Row: {
          id: string
          sso_provider_id: string
          request_id: string
          for_email: string | null
          redirect_to: string | null
          created_at: string | null
          updated_at: string | null
          flow_state_id: string | null
        }
        Insert: {
          id: string
          sso_provider_id: string
          request_id: string
          for_email?: string | null
          redirect_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          flow_state_id?: string | null
        }
        Update: {
          id?: string
          sso_provider_id?: string
          request_id?: string
          for_email?: string | null
          redirect_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          flow_state_id?: string | null
        }
      }
      schema_migrations: {
        Row: {
          version: number
          inserted_at: string | null
        }
        Insert: {
          version: number
          inserted_at?: string | null
        }
        Update: {
          version?: number
          inserted_at?: string | null
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
      secrets: {
        Row: {
          id: string
          name: string | null
          description: string
          secret: string
          key_id: string | null
          nonce: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          description?: string
          secret: string
          key_id?: string | null
          nonce?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          description?: string
          secret?: string
          key_id?: string | null
          nonce?: unknown | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string | null
          updated_at: string | null
          factor_id: string | null
          aal: unknown | null
          not_after: string | null
          refreshed_at: string | null
          user_agent: string | null
          ip: unknown | null
          tag: string | null
        }
        Insert: {
          id: string
          user_id: string
          created_at?: string | null
          updated_at?: string | null
          factor_id?: string | null
          aal?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          user_agent?: string | null
          ip?: unknown | null
          tag?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
          factor_id?: string | null
          aal?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          user_agent?: string | null
          ip?: unknown | null
          tag?: string | null
        }
      }
      sso_domains: {
        Row: {
          id: string
          sso_provider_id: string
          domain: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          sso_provider_id: string
          domain: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          sso_provider_id?: string
          domain?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sso_providers: {
        Row: {
          id: string
          resource_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          resource_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          resource_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      subscription: {
        Row: {
          id: number
          subscription_id: string
          entity: unknown
          filters: string[]
          claims: Json
          claims_role: unknown
          created_at: string
        }
        Insert: {
          id: number
          subscription_id: string
          entity: unknown
          filters?: string[]
          claims: Json
          claims_role: unknown
          created_at?: string
        }
        Update: {
          id?: number
          subscription_id?: string
          entity?: unknown
          filters?: string[]
          claims?: Json
          claims_role?: unknown
          created_at?: string
        }
      }
      users: {
        Row: {
          instance_id: string | null
          id: string
          aud: string | null
          role: string | null
          email: string | null
          encrypted_password: string | null
          email_confirmed_at: string | null
          invited_at: string | null
          confirmation_token: string | null
          confirmation_sent_at: string | null
          recovery_token: string | null
          recovery_sent_at: string | null
          email_change_token_new: string | null
          email_change: string | null
          email_change_sent_at: string | null
          last_sign_in_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          is_super_admin: boolean | null
          created_at: string | null
          updated_at: string | null
          phone: string | null
          phone_confirmed_at: string | null
          phone_change: string | null
          phone_change_token: string | null
          phone_change_sent_at: string | null
          confirmed_at: string | null
          email_change_token_current: string | null
          email_change_confirm_status: number | null
          banned_until: string | null
          reauthentication_token: string | null
          reauthentication_sent_at: string | null
          is_sso_user: boolean
          deleted_at: string | null
          is_anonymous: boolean
          full_name: string | null
          avatar_url: string | null
          is_vendor: boolean | null
          is_admin: boolean | null
          active_role: string | null
          preferred_language: string | null
        }
        Insert: {
          instance_id?: string | null
          id: string
          aud?: string | null
          role?: string | null
          email?: string | null
          encrypted_password?: string | null
          email_confirmed_at?: string | null
          invited_at?: string | null
          confirmation_token?: string | null
          confirmation_sent_at?: string | null
          recovery_token?: string | null
          recovery_sent_at?: string | null
          email_change_token_new?: string | null
          email_change?: string | null
          email_change_sent_at?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          phone?: string | null
          phone_confirmed_at?: string | null
          phone_change?: string | null
          phone_change_token?: string | null
          phone_change_sent_at?: string | null
          confirmed_at?: string | null
          email_change_token_current?: string | null
          email_change_confirm_status?: number | null
          banned_until?: string | null
          reauthentication_token?: string | null
          reauthentication_sent_at?: string | null
          is_sso_user?: boolean
          deleted_at?: string | null
          is_anonymous?: boolean
          full_name?: string | null
          avatar_url?: string | null
          is_vendor?: boolean | null
          is_admin?: boolean | null
          active_role?: string | null
          preferred_language?: string | null
        }
        Update: {
          instance_id?: string | null
          id?: string
          aud?: string | null
          role?: string | null
          email?: string | null
          encrypted_password?: string | null
          email_confirmed_at?: string | null
          invited_at?: string | null
          confirmation_token?: string | null
          confirmation_sent_at?: string | null
          recovery_token?: string | null
          recovery_sent_at?: string | null
          email_change_token_new?: string | null
          email_change?: string | null
          email_change_sent_at?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          phone?: string | null
          phone_confirmed_at?: string | null
          phone_change?: string | null
          phone_change_token?: string | null
          phone_change_sent_at?: string | null
          confirmed_at?: string | null
          email_change_token_current?: string | null
          email_change_confirm_status?: number | null
          banned_until?: string | null
          reauthentication_token?: string | null
          reauthentication_sent_at?: string | null
          is_sso_user?: boolean
          deleted_at?: string | null
          is_anonymous?: boolean
          full_name?: string | null
          avatar_url?: string | null
          is_vendor?: boolean | null
          is_admin?: boolean | null
          active_role?: string | null
          preferred_language?: string | null
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
          feedback_type: unknown | null
          priority: unknown | null
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          message?: string | null
          status?: string | null
          created_at?: string | null
          feedback_type?: unknown | null
          priority?: unknown | null
        }
        Update: {
          id?: string
          vendor_id?: string | null
          message?: string | null
          status?: string | null
          created_at?: string | null
          feedback_type?: unknown | null
          priority?: unknown | null
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
          status: unknown | null
          rejection_reason: string | null
          subcategory__other: string | null
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
          status?: unknown | null
          rejection_reason?: string | null
          subcategory__other?: string | null
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
          status?: unknown | null
          rejection_reason?: string | null
          subcategory__other?: string | null
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
