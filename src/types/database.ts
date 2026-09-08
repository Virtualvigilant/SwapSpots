export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          availability: string | null
          bidder_id: string
          created_at: string
          id: string
          listing_id: string | null
          message: string | null
          request_id: string
          status: Database["public"]["Enums"]["bid_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          availability?: string | null
          bidder_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          availability?: string | null
          bidder_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          county: string | null
          created_at: string
          email_domain: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          email_domain?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          county?: string | null
          created_at?: string
          email_domain?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          blurb: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_catchall: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          blurb?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_catchall?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          blurb?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_catchall?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_subscriptions: {
        Row: {
          category_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_events: {
        Row: {
          created_at: string
          id: string
          initiator_id: string
          recipient_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["contact_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          initiator_id: string
          recipient_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["contact_target"]
        }
        Update: {
          created_at?: string
          id?: string
          initiator_id?: string
          recipient_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["contact_target"]
        }
        Relationships: [
          {
            foreignKeyName: "contact_events_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          blurhash: string | null
          created_at: string
          height: number | null
          id: string
          listing_id: string
          position: number
          storage_path: string
          width: number | null
        }
        Insert: {
          blurhash?: string | null
          created_at?: string
          height?: number | null
          id?: string
          listing_id: string
          position?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          blurhash?: string | null
          created_at?: string
          height?: number | null
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          campus_id: string
          category_id: string
          condition: Database["public"]["Enums"]["item_condition"]
          contact_count: number
          created_at: string
          description: string
          expires_at: string
          favorite_count: number
          id: string
          pickup_area: string | null
          price: number
          price_type: Database["public"]["Enums"]["price_type"]
          search_vector: unknown
          seller_id: string
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          campus_id: string
          category_id: string
          condition?: Database["public"]["Enums"]["item_condition"]
          contact_count?: number
          created_at?: string
          description: string
          expires_at?: string
          favorite_count?: number
          id?: string
          pickup_area?: string | null
          price: number
          price_type?: Database["public"]["Enums"]["price_type"]
          search_vector?: unknown
          seller_id: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          campus_id?: string
          category_id?: string
          condition?: Database["public"]["Enums"]["item_condition"]
          contact_count?: number
          created_at?: string
          description?: string
          expires_at?: string
          favorite_count?: number
          id?: string
          pickup_area?: string | null
          price?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          search_vector?: unknown
          seller_id?: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          category: string | null
          created_at: string
          id: string
          owner_id: string | null
          phrase: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          phrase: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          phrase?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_keywords: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          phrase: string
          severity: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          phrase: string
          severity?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          phrase?: string
          severity?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          payload: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          payload?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          payload?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admission_hash: string | null
          avatar_url: string | null
          bio: string | null
          buyer_rating_avg: number
          buyer_rating_count: number
          campus_id: string
          created_at: string
          full_name: string
          id: string
          is_suspended: boolean
          listings_sold_count: number
          phone_e164: string
          pickup_area: string | null
          requests_fulfilled_count: number
          role: Database["public"]["Enums"]["user_role"]
          seller_rating_avg: number
          seller_rating_count: number
          suspended_until: string | null
          suspension_reason: string | null
          updated_at: string
          username: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
        }
        Insert: {
          admission_hash?: string | null
          avatar_url?: string | null
          bio?: string | null
          buyer_rating_avg?: number
          buyer_rating_count?: number
          campus_id: string
          created_at?: string
          full_name: string
          id: string
          is_suspended?: boolean
          listings_sold_count?: number
          phone_e164: string
          pickup_area?: string | null
          requests_fulfilled_count?: number
          role?: Database["public"]["Enums"]["user_role"]
          seller_rating_avg?: number
          seller_rating_count?: number
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Update: {
          admission_hash?: string | null
          avatar_url?: string | null
          bio?: string | null
          buyer_rating_avg?: number
          buyer_rating_count?: number
          campus_id?: string
          created_at?: string
          full_name?: string
          id?: string
          is_suspended?: boolean
          listings_sold_count?: number
          phone_e164?: string
          pickup_area?: string | null
          requests_fulfilled_count?: number
          role?: Database["public"]["Enums"]["user_role"]
          seller_rating_avg?: number
          seller_rating_count?: number
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          moderator_notes: string | null
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          moderator_notes?: string | null
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          moderator_notes?: string | null
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          awarded_at: string | null
          awarded_bid_id: string | null
          bid_count: number
          budget_max: number | null
          budget_min: number | null
          campus_id: string
          category_id: string
          closed_at: string | null
          created_at: string
          description: string
          expires_at: string
          id: string
          needed_by: string | null
          parent_request_id: string | null
          recurrence: string | null
          requester_id: string
          search_vector: unknown
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          awarded_at?: string | null
          awarded_bid_id?: string | null
          bid_count?: number
          budget_max?: number | null
          budget_min?: number | null
          campus_id: string
          category_id: string
          closed_at?: string | null
          created_at?: string
          description: string
          expires_at?: string
          id?: string
          needed_by?: string | null
          parent_request_id?: string | null
          recurrence?: string | null
          requester_id: string
          search_vector?: unknown
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          awarded_at?: string | null
          awarded_bid_id?: string | null
          bid_count?: number
          budget_max?: number | null
          budget_min?: number | null
          campus_id?: string
          category_id?: string
          closed_at?: string | null
          created_at?: string
          description?: string
          expires_at?: string
          id?: string
          needed_by?: string | null
          parent_request_id?: string | null
          recurrence?: string | null
          requester_id?: string
          search_vector?: unknown
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "requests_awarded_bid_fk"
            columns: ["awarded_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_parent_request_id_fkey"
            columns: ["parent_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          context_id: string
          context_type: Database["public"]["Enums"]["review_context"]
          created_at: string
          id: string
          rating: number
          reviewed_role: Database["public"]["Enums"]["reviewed_role"]
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          context_id: string
          context_type: Database["public"]["Enums"]["review_context"]
          created_at?: string
          id?: string
          rating: number
          reviewed_role: Database["public"]["Enums"]["reviewed_role"]
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          context_id?: string
          context_type?: Database["public"]["Enums"]["review_context"]
          created_at?: string
          id?: string
          rating?: number
          reviewed_role?: Database["public"]["Enums"]["reviewed_role"]
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      strikes: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          report_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          report_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strikes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strikes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strikes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          admission_hash: string
          created_at: string
          id: string
          id_image_path: string
          purge_after: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Insert: {
          admission_hash: string
          created_at?: string
          id?: string
          id_image_path: string
          purge_after?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Update: {
          admission_hash?: string
          created_at?: string
          id?: string
          id_image_path?: string
          purge_after?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          buyer_rating_avg: number | null
          buyer_rating_count: number | null
          campus_id: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          listings_sold_count: number | null
          pickup_area: string | null
          requests_fulfilled_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          seller_rating_avg: number | null
          seller_rating_count: number | null
          username: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          buyer_rating_avg?: number | null
          buyer_rating_count?: number | null
          campus_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          listings_sold_count?: number | null
          pickup_area?: string | null
          requests_fulfilled_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          seller_rating_avg?: number | null
          seller_rating_count?: number | null
          username?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          buyer_rating_avg?: number | null
          buyer_rating_count?: number | null
          campus_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          listings_sold_count?: number | null
          pickup_area?: string | null
          requests_fulfilled_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          seller_rating_avg?: number | null
          seller_rating_count?: number | null
          username?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admission_digest: { Args: { p_admission: string }; Returns: string }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      award_bid: {
        Args: { p_bid_id: string; p_request_id: string }
        Returns: undefined
      }
      bump_view_count: {
        Args: {
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["contact_target"]
        }
        Returns: undefined
      }
      cancel_request: {
        Args: { p_reason?: string; p_request_id: string }
        Returns: undefined
      }
      complete_onboarding: {
        Args: {
          p_campus_slug?: string
          p_full_name: string
          p_phone_e164: string
          p_pickup_area?: string
          p_username: string
        }
        Returns: {
          admission_hash: string | null
          avatar_url: string | null
          bio: string | null
          buyer_rating_avg: number
          buyer_rating_count: number
          campus_id: string
          created_at: string
          full_name: string
          id: string
          is_suspended: boolean
          listings_sold_count: number
          phone_e164: string
          pickup_area: string | null
          requests_fulfilled_count: number
          role: Database["public"]["Enums"]["user_role"]
          seller_rating_avg: number
          seller_rating_count: number
          suspended_until: string | null
          suspension_reason: string | null
          updated_at: string
          username: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_stale_records: { Args: never; Returns: Json }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_verified: { Args: { p_user: string }; Returns: boolean }
      mark_notifications_read: { Args: { p_ids?: string[] }; Returns: number }
      mark_request_fulfilled: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      purge_verification_artifacts: { Args: never; Returns: number }
      recalculate_reputation: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      report_target_owner: {
        Args: {
          p_id: string
          p_type: Database["public"]["Enums"]["report_target"]
        }
        Returns: string
      }
      resolve_report: {
        Args: {
          p_notes?: string
          p_report_id: string
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      reveal_contact: {
        Args: {
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["contact_target"]
        }
        Returns: Json
      }
      review_verification: {
        Args: { p_approve: boolean; p_reason?: string; p_request_id: string }
        Returns: undefined
      }
      screen_text: {
        Args: { p_text: string }
        Returns: {
          category: string
          phrase: string
          severity: string
        }[]
      }
      search_listings: {
        Args: {
          p_campus_slug?: string
          p_category_slug?: string
          p_conditions?: Database["public"]["Enums"]["item_condition"][]
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_query?: string
          p_sort?: string
          p_verified_only?: boolean
        }
        Returns: {
          category_name: string
          category_slug: string
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string
          description: string
          expires_at: string
          favorite_count: number
          id: string
          image_path: string
          pickup_area: string
          price: number
          price_type: Database["public"]["Enums"]["price_type"]
          rank: number
          seller_avatar_url: string
          seller_id: string
          seller_name: string
          seller_rating_avg: number
          seller_rating_count: number
          seller_username: string
          seller_verified: boolean
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          total_count: number
          view_count: number
        }[]
      }
      search_requests: {
        Args: {
          p_campus_slug?: string
          p_category_slug?: string
          p_limit?: number
          p_offset?: number
          p_open_only?: boolean
          p_query?: string
          p_sort?: string
        }
        Returns: {
          bid_count: number
          budget_max: number
          budget_min: number
          category_name: string
          category_slug: string
          created_at: string
          description: string
          expires_at: string
          id: string
          lowest_bid: number
          needed_by: string
          rank: number
          requester_avatar_url: string
          requester_id: string
          requester_name: string
          requester_username: string
          requester_verified: boolean
          status: Database["public"]["Enums"]["request_status"]
          title: string
          total_count: number
          view_count: number
        }[]
      }
      submit_verification: {
        Args: { p_admission_number: string; p_id_image_path: string }
        Returns: {
          admission_hash: string
          created_at: string
          id: string
          id_image_path: string
          purge_after: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "verification_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired"
      contact_target: "listing" | "request" | "bid"
      item_condition:
        | "new"
        | "like_new"
        | "good"
        | "fair"
        | "for_parts"
        | "not_applicable"
      listing_status:
        | "draft"
        | "active"
        | "reserved"
        | "sold"
        | "expired"
        | "hidden"
        | "removed"
      price_type: "fixed" | "negotiable" | "starting_from" | "free"
      report_status: "open" | "reviewing" | "actioned" | "dismissed"
      report_target: "listing" | "request" | "bid" | "profile" | "review"
      request_status: "open" | "awarded" | "fulfilled" | "cancelled" | "expired"
      review_context: "listing" | "request"
      reviewed_role: "seller" | "buyer"
      user_role: "member" | "moderator" | "admin"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bid_status: ["pending", "accepted", "rejected", "withdrawn", "expired"],
      contact_target: ["listing", "request", "bid"],
      item_condition: [
        "new",
        "like_new",
        "good",
        "fair",
        "for_parts",
        "not_applicable",
      ],
      listing_status: [
        "draft",
        "active",
        "reserved",
        "sold",
        "expired",
        "hidden",
        "removed",
      ],
      price_type: ["fixed", "negotiable", "starting_from", "free"],
      report_status: ["open", "reviewing", "actioned", "dismissed"],
      report_target: ["listing", "request", "bid", "profile", "review"],
      request_status: ["open", "awarded", "fulfilled", "cancelled", "expired"],
      review_context: ["listing", "request"],
      reviewed_role: ["seller", "buyer"],
      user_role: ["member", "moderator", "admin"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
