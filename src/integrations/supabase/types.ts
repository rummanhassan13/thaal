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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          opening_hours: Json
          phone: string | null
          restaurant_id: string
          slug: string
          sort: number
          timezone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          opening_hours?: Json
          phone?: string | null
          restaurant_id: string
          slug: string
          sort?: number
          timezone?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          opening_hours?: Json
          phone?: string | null
          restaurant_id?: string
          slug?: string
          sort?: number
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          menu_id: string
          name: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_id: string
          name: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_id?: string
          name?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_addons: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          name: string
          price: number
          sort: number
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          name: string
          price?: number
          sort?: number
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          name?: string
          price?: number
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "dish_addons_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[]
          category_id: string
          created_at: string
          description: string | null
          id: string
          ingredients: string[]
          is_sold_out: boolean
          is_special: boolean
          is_spicy: boolean
          is_veg: boolean
          name: string
          photo_url: string | null
          price: number
          short_description: string | null
          sort: number
          spice_level: number
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string[]
          is_sold_out?: boolean
          is_special?: boolean
          is_spicy?: boolean
          is_veg?: boolean
          name: string
          photo_url?: string | null
          price?: number
          short_description?: string | null
          sort?: number
          spice_level?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string[]
          is_sold_out?: boolean
          is_special?: boolean
          is_spicy?: boolean
          is_veg?: boolean
          name?: string
          photo_url?: string | null
          price?: number
          short_description?: string | null
          sort?: number
          spice_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_events: {
        Row: {
          branch_id: string
          created_at: string
          dish_id: string | null
          id: string
          type: Database["public"]["Enums"]["menu_event_type"]
        }
        Insert: {
          branch_id: string
          created_at?: string
          dish_id?: string | null
          id?: string
          type: Database["public"]["Enums"]["menu_event_type"]
        }
        Update: {
          branch_id?: string
          created_at?: string
          dish_id?: string | null
          id?: string
          type?: Database["public"]["Enums"]["menu_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "menu_events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_events_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_schedules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          menu_id: string
          start_time: string
          weekdays: number[]
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          menu_id: string
          start_time: string
          weekdays?: number[]
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          menu_id?: string
          start_time?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "menu_schedules_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          id: string
          name: string
          sort: number
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          id?: string
          name: string
          sort?: number
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          id?: string
          name?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "menus_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          addons: Json
          created_at: string
          dish_id: string | null
          id: string
          name: string
          note: string | null
          order_id: string
          qty: number
          unit_price: number
        }
        Insert: {
          addons?: Json
          created_at?: string
          dish_id?: string | null
          id?: string
          name: string
          note?: string | null
          order_id: string
          qty: number
          unit_price: number
        }
        Update: {
          addons?: Json
          created_at?: string
          dish_id?: string | null
          id?: string
          name?: string
          note?: string | null
          order_id?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string
          created_at: string
          customer_note: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          table_label: string | null
          total: number
          tracking_token: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_note?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          table_label?: string | null
          total?: number
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_note?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          table_label?: string | null
          total?: number
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          cover_url: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_status: string | null
          published: boolean
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_status?: string | null
          published?: boolean
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_status?: string | null
          published?: boolean
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          dish_id: string
          id: string
          order_id: string
          rating: number
          read_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          dish_id: string
          id?: string
          order_id: string
          rating: number
          read_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          dish_id?: string
          id?: string
          order_id?: string
          rating?: number
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["service_status"]
          table_id: string | null
          type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["service_status"]
          table_id?: string | null
          type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["service_status"]
          table_id?: string | null
          type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          label: string
          qr_code_token: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          label: string
          qr_code_token?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          label?: string
          qr_code_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          accent: string
          branch_id: string | null
          cover_url: string | null
          created_at: string
          font_pairing: Database["public"]["Enums"]["font_pairing"]
          id: string
          logo_url: string | null
          mode: Database["public"]["Enums"]["theme_mode"]
          restaurant_id: string
        }
        Insert: {
          accent?: string
          branch_id?: string | null
          cover_url?: string | null
          created_at?: string
          font_pairing?: Database["public"]["Enums"]["font_pairing"]
          id?: string
          logo_url?: string | null
          mode?: Database["public"]["Enums"]["theme_mode"]
          restaurant_id: string
        }
        Update: {
          accent?: string
          branch_id?: string | null
          cover_url?: string | null
          created_at?: string
          font_pairing?: Database["public"]["Enums"]["font_pairing"]
          id?: string
          logo_url?: string | null
          mode?: Database["public"]["Enums"]["theme_mode"]
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "themes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_requests: {
        Row: {
          contact: string
          created_at: string
          id: string
          message: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          restaurant_id: string
          status: string
          user_id: string
        }
        Insert: {
          contact: string
          created_at?: string
          id?: string
          message?: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          restaurant_id: string
          status?: string
          user_id?: string
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          message?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          restaurant_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_requests_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write_media: { Args: { _path: string }; Returns: boolean }
      get_branch_analytics: {
        Args: { p_branch_id: string; p_from: string; p_to: string }
        Returns: Json
      }
      get_dish_reviews: {
        Args: { p_dish_id: string }
        Returns: {
          avg_rating: number
          recent: Json
          review_count: number
        }[]
      }
      get_order_status: {
        Args: { p_order_id: string; p_token: string }
        Returns: {
          created_at: string
          id: string
          items: Json
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["order_status"]
          table_label: string
          total: number
        }[]
      }
      get_table_label: {
        Args: { p_branch_id: string; p_table: string }
        Returns: string
      }
      is_restaurant_member: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      is_restaurant_owner: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      is_restaurant_published: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      place_order: {
        Args: {
          p_branch_id: string
          p_items: Json
          p_note?: string
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_table: string
        }
        Returns: {
          order_id: string
          total: number
          tracking_token: string
        }[]
      }
      request_service: {
        Args: {
          p_branch_id: string
          p_table: string
          p_type: Database["public"]["Enums"]["service_type"]
        }
        Returns: string
      }
      resolve_table: {
        Args: { _token: string }
        Returns: {
          branch_id: string
          label: string
          restaurant_slug: string
          table_id: string
        }[]
      }
      restaurant_of_branch: { Args: { _id: string }; Returns: string }
      restaurant_of_category: { Args: { _id: string }; Returns: string }
      restaurant_of_dish: { Args: { _id: string }; Returns: string }
      restaurant_of_menu: { Args: { _id: string }; Returns: string }
      restaurant_of_order: { Args: { _id: string }; Returns: string }
      slug_available: { Args: { _slug: string }; Returns: boolean }
      submit_review: {
        Args: {
          p_comment?: string
          p_dish_id: string
          p_order_id: string
          p_rating: number
          p_token: string
        }
        Returns: string
      }
      table_in_branch: {
        Args: { _branch_id: string; _table_id: string }
        Returns: boolean
      }
    }
    Enums: {
      font_pairing:
        | "bricolage_figtree"
        | "young_serif_onest"
        | "gloock_manrope"
        | "gabarito_instrument_sans"
      member_role: "owner" | "staff"
      menu_event_type: "scan" | "dish_view" | "add_to_cart"
      order_status: "new" | "preparing" | "served" | "cancelled"
      payment_method: "online" | "counter"
      payment_status: "unpaid" | "paid"
      plan_tier: "free" | "pro" | "business"
      service_status: "open" | "done"
      service_type: "waiter" | "bill"
      theme_mode: "light" | "dark"
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
      font_pairing: [
        "bricolage_figtree",
        "young_serif_onest",
        "gloock_manrope",
        "gabarito_instrument_sans",
      ],
      member_role: ["owner", "staff"],
      menu_event_type: ["scan", "dish_view", "add_to_cart"],
      order_status: ["new", "preparing", "served", "cancelled"],
      payment_method: ["online", "counter"],
      payment_status: ["unpaid", "paid"],
      plan_tier: ["free", "pro", "business"],
      service_status: ["open", "done"],
      service_type: ["waiter", "bill"],
      theme_mode: ["light", "dark"],
    },
  },
} as const
