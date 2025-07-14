export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      containers: {
        Row: {
          created_at: string
          dangerous_goods: boolean | null
          eta: string | null
          etd: string | null
          id: string
          max_pallets: number | null
          max_volume: number | null
          max_weight: number | null
          number: string
          status: string | null
          transitaire: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dangerous_goods?: boolean | null
          eta?: string | null
          etd?: string | null
          id?: string
          max_pallets?: number | null
          max_volume?: number | null
          max_weight?: number | null
          number: string
          status?: string | null
          transitaire: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dangerous_goods?: boolean | null
          eta?: string | null
          etd?: string | null
          id?: string
          max_pallets?: number | null
          max_volume?: number | null
          max_weight?: number | null
          number?: string
          status?: string | null
          transitaire?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_products: {
        Row: {
          carton_quantity: number | null
          created_at: string
          id: string
          order_id: string
          palette_quantity: number | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          carton_quantity?: number | null
          created_at?: string
          id?: string
          order_id: string
          palette_quantity?: number | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          carton_quantity?: number | null
          created_at?: string
          id?: string
          order_id?: string
          palette_quantity?: number | null
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_products_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cartons: number | null
          client_id: string | null
          container_id: string | null
          created_at: string
          current_transitaire: string | null
          id: string
          order_date: string
          order_number: string
          packaging: string | null
          payment_date: string | null
          payment_type: string
          status: string
          supplier: string
          total_price: number | null
          transitaire_entry: string | null
          unit_price: number | null
          updated_at: string
          volume: number | null
          weight: number | null
        }
        Insert: {
          cartons?: number | null
          client_id?: string | null
          container_id?: string | null
          created_at?: string
          current_transitaire?: string | null
          id?: string
          order_date: string
          order_number: string
          packaging?: string | null
          payment_date?: string | null
          payment_type: string
          status: string
          supplier: string
          total_price?: number | null
          transitaire_entry?: string | null
          unit_price?: number | null
          updated_at?: string
          volume?: number | null
          weight?: number | null
        }
        Update: {
          cartons?: number | null
          client_id?: string | null
          container_id?: string | null
          created_at?: string
          current_transitaire?: string | null
          id?: string
          order_date?: string
          order_number?: string
          packaging?: string | null
          payment_date?: string | null
          payment_type?: string
          status?: string
          supplier?: string
          total_price?: number | null
          transitaire_entry?: string | null
          unit_price?: number | null
          updated_at?: string
          volume?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          carton_dimensions_height: number | null
          carton_dimensions_length: number | null
          carton_dimensions_width: number | null
          carton_material_code: string | null
          carton_signage: string | null
          carton_volume: number | null
          carton_weight: number | null
          cartons_per_layer: number | null
          cartons_per_palette: number | null
          category: string
          cost: number
          created_at: string
          dangerous: boolean | null
          description: string | null
          id: string
          layers_per_palette: number | null
          name: string
          package_dimensions_height: number | null
          package_dimensions_length: number | null
          package_dimensions_width: number | null
          package_material_code: string | null
          package_signage: string | null
          package_volume: number | null
          package_weight: number | null
          packages_per_carton: number | null
          palette_dimensions_height: number | null
          palette_dimensions_length: number | null
          palette_dimensions_width: number | null
          palette_type: string | null
          palette_weight: number | null
          sku: string
          status: string | null
          suppliers: string[] | null
          unit: string
          units_per_carton: number | null
          units_per_package: number | null
          updated_at: string
        }
        Insert: {
          carton_dimensions_height?: number | null
          carton_dimensions_length?: number | null
          carton_dimensions_width?: number | null
          carton_material_code?: string | null
          carton_signage?: string | null
          carton_volume?: number | null
          carton_weight?: number | null
          cartons_per_layer?: number | null
          cartons_per_palette?: number | null
          category: string
          cost: number
          created_at?: string
          dangerous?: boolean | null
          description?: string | null
          id?: string
          layers_per_palette?: number | null
          name: string
          package_dimensions_height?: number | null
          package_dimensions_length?: number | null
          package_dimensions_width?: number | null
          package_material_code?: string | null
          package_signage?: string | null
          package_volume?: number | null
          package_weight?: number | null
          packages_per_carton?: number | null
          palette_dimensions_height?: number | null
          palette_dimensions_length?: number | null
          palette_dimensions_width?: number | null
          palette_type?: string | null
          palette_weight?: number | null
          sku: string
          status?: string | null
          suppliers?: string[] | null
          unit: string
          units_per_carton?: number | null
          units_per_package?: number | null
          updated_at?: string
        }
        Update: {
          carton_dimensions_height?: number | null
          carton_dimensions_length?: number | null
          carton_dimensions_width?: number | null
          carton_material_code?: string | null
          carton_signage?: string | null
          carton_volume?: number | null
          carton_weight?: number | null
          cartons_per_layer?: number | null
          cartons_per_palette?: number | null
          category?: string
          cost?: number
          created_at?: string
          dangerous?: boolean | null
          description?: string | null
          id?: string
          layers_per_palette?: number | null
          name?: string
          package_dimensions_height?: number | null
          package_dimensions_length?: number | null
          package_dimensions_width?: number | null
          package_material_code?: string | null
          package_signage?: string | null
          package_volume?: number | null
          package_weight?: number | null
          packages_per_carton?: number | null
          palette_dimensions_height?: number | null
          palette_dimensions_length?: number | null
          palette_dimensions_width?: number | null
          palette_type?: string | null
          palette_weight?: number | null
          sku?: string
          status?: string | null
          suppliers?: string[] | null
          unit?: string
          units_per_carton?: number | null
          units_per_package?: number | null
          updated_at?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
