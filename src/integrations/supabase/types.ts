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
      app_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          communication_preferences: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_role: string | null
          country: string | null
          created_at: string
          delivery_address: string | null
          documents: string[] | null
          email: string | null
          id: string
          main_contact_name: string | null
          name: string
          notes: string | null
          payment_conditions: string | null
          phone: string | null
          preferred_language: string | null
          preferred_transporters: string | null
          pricing_terms: string | null
          secondary_contact: string | null
          status: string | null
          time_zone: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          communication_preferences?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          delivery_address?: string | null
          documents?: string[] | null
          email?: string | null
          id?: string
          main_contact_name?: string | null
          name: string
          notes?: string | null
          payment_conditions?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_transporters?: string | null
          pricing_terms?: string | null
          secondary_contact?: string | null
          status?: string | null
          time_zone?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          communication_preferences?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          delivery_address?: string | null
          documents?: string[] | null
          email?: string | null
          id?: string
          main_contact_name?: string | null
          name?: string
          notes?: string | null
          payment_conditions?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_transporters?: string | null
          pricing_terms?: string | null
          secondary_contact?: string | null
          status?: string | null
          time_zone?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      containers: {
        Row: {
          arrival_port: string | null
          created_at: string
          dangerous_goods: boolean | null
          departure_port: string | null
          eta: string | null
          etd: string | null
          id: string
          max_pallets: number | null
          max_volume: number | null
          max_weight: number | null
          number: string
          port_cutoff: string | null
          reservation_number: string | null
          status: string | null
          transitaire: string
          type: string
          updated_at: string
        }
        Insert: {
          arrival_port?: string | null
          created_at?: string
          dangerous_goods?: boolean | null
          departure_port?: string | null
          eta?: string | null
          etd?: string | null
          id?: string
          max_pallets?: number | null
          max_volume?: number | null
          max_weight?: number | null
          number: string
          port_cutoff?: string | null
          reservation_number?: string | null
          status?: string | null
          transitaire: string
          type: string
          updated_at?: string
        }
        Update: {
          arrival_port?: string | null
          created_at?: string
          dangerous_goods?: boolean | null
          departure_port?: string | null
          eta?: string | null
          etd?: string | null
          id?: string
          max_pallets?: number | null
          max_volume?: number | null
          max_weight?: number | null
          number?: string
          port_cutoff?: string | null
          reservation_number?: string | null
          status?: string | null
          transitaire?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      deleted_items: {
        Row: {
          created_at: string
          deleted_at: string
          deleted_by: string | null
          id: string
          item_data: Json
          item_id: string
          reason: string | null
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          item_data: Json
          item_id: string
          reason?: string | null
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          item_data?: Json
          item_id?: string
          reason?: string | null
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      groupage_bookings: {
        Row: {
          booking_date: string | null
          booking_status: string | null
          confirmed_by_transitaire: boolean | null
          cost_calculated: number
          created_at: string
          groupage_id: string
          has_dangerous_goods: boolean | null
          id: string
          order_id: string
          palettes_booked: number
          reservation_id: string | null
          transitaire_notes: string | null
          updated_at: string
          volume_booked: number
          weight_booked: number
        }
        Insert: {
          booking_date?: string | null
          booking_status?: string | null
          confirmed_by_transitaire?: boolean | null
          cost_calculated?: number
          created_at?: string
          groupage_id: string
          has_dangerous_goods?: boolean | null
          id?: string
          order_id: string
          palettes_booked?: number
          reservation_id?: string | null
          transitaire_notes?: string | null
          updated_at?: string
          volume_booked?: number
          weight_booked?: number
        }
        Update: {
          booking_date?: string | null
          booking_status?: string | null
          confirmed_by_transitaire?: boolean | null
          cost_calculated?: number
          created_at?: string
          groupage_id?: string
          has_dangerous_goods?: boolean | null
          id?: string
          order_id?: string
          palettes_booked?: number
          reservation_id?: string | null
          transitaire_notes?: string | null
          updated_at?: string
          volume_booked?: number
          weight_booked?: number
        }
        Relationships: [
          {
            foreignKeyName: "groupage_bookings_groupage_id_fkey"
            columns: ["groupage_id"]
            isOneToOne: false
            referencedRelation: "groupages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groupage_bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      groupages: {
        Row: {
          allows_dangerous_goods: boolean | null
          arrival_date: string | null
          available_space_pallets: number
          available_volume: number
          available_weight: number
          container_id: string
          cost_per_kg: number | null
          cost_per_m3: number | null
          cost_per_palette: number
          created_at: string
          departure_date: string | null
          id: string
          max_space_pallets: number
          max_volume: number
          max_weight: number
          notes: string | null
          reservation_number: string | null
          status: string | null
          transitaire: string
          updated_at: string
        }
        Insert: {
          allows_dangerous_goods?: boolean | null
          arrival_date?: string | null
          available_space_pallets?: number
          available_volume?: number
          available_weight?: number
          container_id: string
          cost_per_kg?: number | null
          cost_per_m3?: number | null
          cost_per_palette?: number
          created_at?: string
          departure_date?: string | null
          id?: string
          max_space_pallets?: number
          max_volume?: number
          max_weight?: number
          notes?: string | null
          reservation_number?: string | null
          status?: string | null
          transitaire: string
          updated_at?: string
        }
        Update: {
          allows_dangerous_goods?: boolean | null
          arrival_date?: string | null
          available_space_pallets?: number
          available_volume?: number
          available_weight?: number
          container_id?: string
          cost_per_kg?: number | null
          cost_per_m3?: number | null
          cost_per_palette?: number
          created_at?: string
          departure_date?: string | null
          id?: string
          max_space_pallets?: number
          max_volume?: number
          max_weight?: number
          notes?: string | null
          reservation_number?: string | null
          status?: string | null
          transitaire?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groupages_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
        ]
      }
      number_counters: {
        Row: {
          created_at: string
          current_number: number
          entity_type: string
          id: string
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_number?: number
          entity_type: string
          id?: string
          prefix?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_number?: number
          entity_type?: string
          id?: string
          prefix?: string
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
          is_received: boolean | null
          order_date: string
          order_number: string
          order_status: string | null
          packaging: string | null
          payment_date: string | null
          payment_type: string
          reservation_id: string | null
          status: string
          supplier: string
          supplier_payment_status: string | null
          total_ht: number | null
          total_price: number | null
          total_ttc: number | null
          transitaire_entry: string | null
          transitaire_entry_number: string | null
          tva_rate: number | null
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
          is_received?: boolean | null
          order_date: string
          order_number: string
          order_status?: string | null
          packaging?: string | null
          payment_date?: string | null
          payment_type: string
          reservation_id?: string | null
          status: string
          supplier: string
          supplier_payment_status?: string | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          transitaire_entry?: string | null
          transitaire_entry_number?: string | null
          tva_rate?: number | null
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
          is_received?: boolean | null
          order_date?: string
          order_number?: string
          order_status?: string | null
          packaging?: string | null
          payment_date?: string | null
          payment_type?: string
          reservation_id?: string | null
          status?: string
          supplier?: string
          supplier_payment_status?: string | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          transitaire_entry?: string | null
          transitaire_entry_number?: string | null
          tva_rate?: number | null
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
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_date: string
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          imdg_class: string | null
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
          imdg_class?: string | null
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
          imdg_class?: string | null
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
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string | null
          id: string
          last_login_at: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          last_login_at?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          file_url: string | null
          generated_by: string | null
          id: string
          parameters: Json | null
          status: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          status?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          arrival_port: string | null
          available_pallets: number | null
          available_volume: number | null
          available_weight: number | null
          cost_per_kg: number | null
          cost_per_m3: number | null
          cost_per_palette: number | null
          created_at: string
          dangerous_goods_accepted: boolean | null
          departure_port: string | null
          eta: string | null
          etd: string | null
          id: string
          max_pallets: number | null
          max_volume: number | null
          max_weight: number | null
          notes: string | null
          port_cutoff: string | null
          reservation_number: string | null
          status: string | null
          transitaire: string
          type: string
          updated_at: string
        }
        Insert: {
          arrival_port?: string | null
          available_pallets?: number | null
          available_volume?: number | null
          available_weight?: number | null
          cost_per_kg?: number | null
          cost_per_m3?: number | null
          cost_per_palette?: number | null
          created_at?: string
          dangerous_goods_accepted?: boolean | null
          departure_port?: string | null
          eta?: string | null
          etd?: string | null
          id?: string
          max_pallets?: number | null
          max_volume?: number | null
          max_weight?: number | null
          notes?: string | null
          port_cutoff?: string | null
          reservation_number?: string | null
          status?: string | null
          transitaire: string
          type: string
          updated_at?: string
        }
        Update: {
          arrival_port?: string | null
          available_pallets?: number | null
          available_volume?: number | null
          available_weight?: number | null
          cost_per_kg?: number | null
          cost_per_m3?: number | null
          cost_per_palette?: number | null
          created_at?: string
          dangerous_goods_accepted?: boolean | null
          departure_port?: string | null
          eta?: string | null
          etd?: string | null
          id?: string
          max_pallets?: number | null
          max_volume?: number | null
          max_weight?: number | null
          notes?: string | null
          port_cutoff?: string | null
          reservation_number?: string | null
          status?: string | null
          transitaire?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          associated_clients: string[] | null
          attachments: string[] | null
          country: string | null
          created_at: string
          currency: string | null
          delivery_rate: number | null
          email: string | null
          exclusive_to_client: boolean | null
          id: string
          incidents_count: number | null
          incoterm: string | null
          last_order_date: string | null
          main_contact_name: string | null
          minimum_order_amount: number | null
          minimum_order_quantity: number | null
          name: string
          notes: string | null
          packaging_specs: string | null
          payment_conditions: string | null
          payment_method: string | null
          phone: string | null
          position: string | null
          preferred_communication: string | null
          preparation_time: number | null
          product_types: string[] | null
          reliability_rating: number | null
          shipping_origin: string | null
          ships_themselves: boolean | null
          status: string
          total_orders: number | null
          transport_partners: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          associated_clients?: string[] | null
          attachments?: string[] | null
          country?: string | null
          created_at?: string
          currency?: string | null
          delivery_rate?: number | null
          email?: string | null
          exclusive_to_client?: boolean | null
          id?: string
          incidents_count?: number | null
          incoterm?: string | null
          last_order_date?: string | null
          main_contact_name?: string | null
          minimum_order_amount?: number | null
          minimum_order_quantity?: number | null
          name: string
          notes?: string | null
          packaging_specs?: string | null
          payment_conditions?: string | null
          payment_method?: string | null
          phone?: string | null
          position?: string | null
          preferred_communication?: string | null
          preparation_time?: number | null
          product_types?: string[] | null
          reliability_rating?: number | null
          shipping_origin?: string | null
          ships_themselves?: boolean | null
          status?: string
          total_orders?: number | null
          transport_partners?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          associated_clients?: string[] | null
          attachments?: string[] | null
          country?: string | null
          created_at?: string
          currency?: string | null
          delivery_rate?: number | null
          email?: string | null
          exclusive_to_client?: boolean | null
          id?: string
          incidents_count?: number | null
          incoterm?: string | null
          last_order_date?: string | null
          main_contact_name?: string | null
          minimum_order_amount?: number | null
          minimum_order_quantity?: number | null
          name?: string
          notes?: string | null
          packaging_specs?: string | null
          payment_conditions?: string | null
          payment_method?: string | null
          phone?: string | null
          position?: string | null
          preferred_communication?: string | null
          preparation_time?: number | null
          product_types?: string[] | null
          reliability_rating?: number | null
          shipping_origin?: string | null
          ships_themselves?: boolean | null
          status?: string
          total_orders?: number | null
          transport_partners?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transitaires: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          dangerous_goods_certified: boolean | null
          id: string
          max_container_capacity: number | null
          name: string
          notes: string | null
          services: string[] | null
          specialties: string[] | null
          status: string | null
          tracking_system_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          dangerous_goods_certified?: boolean | null
          id?: string
          max_container_capacity?: number | null
          name: string
          notes?: string | null
          services?: string[] | null
          specialties?: string[] | null
          status?: string | null
          tracking_system_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          dangerous_goods_certified?: boolean | null
          id?: string
          max_container_capacity?: number | null
          name?: string
          notes?: string | null
          services?: string[] | null
          specialties?: string[] | null
          status?: string | null
          tracking_system_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_order_totals: {
        Args: { order_id_param: string }
        Returns: undefined
      }
      generate_next_number: {
        Args: { entity_type_param: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      move_to_trash: {
        Args: { p_table_name: string; p_item_id: string; p_reason?: string }
        Returns: string
      }
      restore_from_trash: {
        Args: { p_trash_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
