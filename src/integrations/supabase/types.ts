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
      access_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          detail: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      access_profile_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          company_id: string
          created_at: string
          id: string
          module_slug: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id: string
          created_at?: string
          id?: string
          module_slug: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id?: string
          created_at?: string
          id?: string
          module_slug?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_profile_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_profile_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_profile_submodule_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          company_id: string
          created_at: string
          id: string
          module_slug: string
          profile_id: string
          submodule_slug: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id: string
          created_at?: string
          id?: string
          module_slug: string
          profile_id: string
          submodule_slug: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id?: string
          created_at?: string
          id?: string
          module_slug?: string
          profile_id?: string
          submodule_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_profile_submodule_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_profile_submodule_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_profiles: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          name: string
          permissions: Json
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          id?: string
          name: string
          permissions?: Json
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          permissions?: Json
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string
          created_at: string
          document: string | null
          enabled_modules: string[]
          enabled_submodules: string[]
          id: string
          logo_url: string
          name: string
          phone: string
          responsible: string
          segment: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          document?: string | null
          enabled_modules?: string[]
          enabled_submodules?: string[]
          id?: string
          logo_url?: string
          name: string
          phone?: string
          responsible?: string
          segment?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          document?: string | null
          enabled_modules?: string[]
          enabled_submodules?: string[]
          id?: string
          logo_url?: string
          name?: string
          phone?: string
          responsible?: string
          segment?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_seasons: {
        Row: {
          area_unit: string
          company_id: string
          created_at: string
          created_by: string | null
          crop_type: string
          cultivated_area: number
          end_date: string | null
          field_id: string | null
          id: string
          name: string
          notes: string
          pick_rate: number
          production_unit: string
          property_id: string | null
          season_year: number
          start_date: string | null
          status: string
          terrain_type: string
          updated_at: string
        }
        Insert: {
          area_unit?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          crop_type?: string
          cultivated_area?: number
          end_date?: string | null
          field_id?: string | null
          id?: string
          name: string
          notes?: string
          pick_rate?: number
          production_unit?: string
          property_id?: string | null
          season_year: number
          start_date?: string | null
          status?: string
          terrain_type?: string
          updated_at?: string
        }
        Update: {
          area_unit?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          crop_type?: string
          cultivated_area?: number
          end_date?: string | null
          field_id?: string | null
          id?: string
          name?: string
          notes?: string
          pick_rate?: number
          production_unit?: string
          property_id?: string | null
          season_year?: number
          start_date?: string | null
          status?: string
          terrain_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_seasons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_seasons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          category: string
          city: string
          company_id: string
          contact_name: string
          created_at: string
          document: string
          email: string
          id: string
          name: string
          notes: string
          payment_terms: string
          phone: string
          state: string
          state_registration: string
          status: string
          trade_name: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address?: string
          category?: string
          city?: string
          company_id: string
          contact_name?: string
          created_at?: string
          document?: string
          email?: string
          id?: string
          name: string
          notes?: string
          payment_terms?: string
          phone?: string
          state?: string
          state_registration?: string
          status?: string
          trade_name?: string
          updated_at?: string
          zip_code?: string
        }
        Update: {
          address?: string
          category?: string
          city?: string
          company_id?: string
          contact_name?: string
          created_at?: string
          document?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          state?: string
          state_registration?: string
          status?: string
          trade_name?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string
          admission_date: string | null
          allocation: string
          birth_date: string | null
          company_id: string
          contract_type: string
          cpf: string
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          job_title: string
          notes: string
          phone: string
          rg: string
          salary: number
          status: string
          termination_date: string | null
          updated_at: string
        }
        Insert: {
          address?: string
          admission_date?: string | null
          allocation?: string
          birth_date?: string | null
          company_id: string
          contract_type?: string
          cpf?: string
          created_at?: string
          department?: string
          email?: string
          full_name: string
          id?: string
          job_title?: string
          notes?: string
          phone?: string
          rg?: string
          salary?: number
          status?: string
          termination_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          admission_date?: string | null
          allocation?: string
          birth_date?: string | null
          company_id?: string
          contract_type?: string
          cpf?: string
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          job_title?: string
          notes?: string
          phone?: string
          rg?: string
          salary?: number
          status?: string
          termination_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          company_id: string
          cost_center_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          kind: Database["public"]["Enums"]["entry_kind"]
          notes: string
          paid_at: string | null
          season_id: string | null
          status: Database["public"]["Enums"]["entry_status"]
          supplier: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          company_id: string
          cost_center_id?: string | null
          created_at?: string
          description: string
          due_date?: string
          id?: string
          kind: Database["public"]["Enums"]["entry_kind"]
          notes?: string
          paid_at?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          supplier?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["entry_kind"]
          notes?: string
          paid_at?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          supplier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "crop_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      harvest_records: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          employee_id: string | null
          harvested_at: string
          id: string
          notes: string
          picker_name: string
          quantity: number
          season_id: string
          total_amount: number
          unit_rate: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          harvested_at: string
          id?: string
          notes?: string
          picker_name?: string
          quantity?: number
          season_id: string
          total_amount?: number
          unit_rate?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          harvested_at?: string
          id?: string
          notes?: string
          picker_name?: string
          quantity?: number
          season_id?: string
          total_amount?: number
          unit_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvest_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_records_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "crop_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          adjusted_at: string | null
          adjustment: number
          company_id: string
          counted_at: string
          counted_quantity: number
          created_at: string
          created_by: string | null
          difference: number
          id: string
          item_id: string
          notes: string
          status: string
          system_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          adjusted_at?: string | null
          adjustment?: number
          company_id: string
          counted_at?: string
          counted_quantity: number
          created_at?: string
          created_by?: string | null
          difference?: number
          id?: string
          item_id: string
          notes?: string
          status?: string
          system_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          adjusted_at?: string | null
          adjustment?: number
          company_id?: string
          counted_at?: string
          counted_quantity?: number
          created_at?: string
          created_by?: string | null
          difference?: number
          id?: string
          item_id?: string
          notes?: string
          status?: string
          system_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          company_id: string
          created_at: string
          id: string
          min_quantity: number
          name: string
          quantity: number
          status: string
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          status?: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          status?: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_positions: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          description: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          company_id: string
          created_at: string
          deductions: number
          employees_count: number
          gross_total: number
          id: string
          net_total: number
          reference_month: string
          status: Database["public"]["Enums"]["doc_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deductions?: number
          employees_count?: number
          gross_total?: number
          id?: string
          net_total?: number
          reference_month: string
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deductions?: number
          employees_count?: number
          gross_total?: number
          id?: string
          net_total?: number
          reference_month?: string
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      production_activities: {
        Row: {
          activity_date: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          employee_id: string | null
          id: string
          inventory_item_id: string | null
          kind: string
          notes: string
          quantity: number
          season_id: string
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          activity_date: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          employee_id?: string | null
          id?: string
          inventory_item_id?: string | null
          kind: string
          notes?: string
          quantity?: number
          season_id: string
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          activity_date?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          employee_id?: string | null
          id?: string
          inventory_item_id?: string | null
          kind?: string
          notes?: string
          quantity?: number
          season_id?: string
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_activities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_activities_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_activities_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "crop_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_profile_id: string | null
          company_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          job_title: string
          must_change_password: boolean
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          username: string
          welcome_seen_at: string | null
        }
        Insert: {
          access_profile_id?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          job_title?: string
          must_change_password?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username: string
          welcome_seen_at?: string | null
        }
        Update: {
          access_profile_id?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_title?: string
          must_change_password?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username?: string
          welcome_seen_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_access_profile_id_fkey"
            columns: ["access_profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          inventory_item_id: string | null
          purchase_id: string
          quantity: number
          total: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          inventory_item_id?: string | null
          purchase_id: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          inventory_item_id?: string | null
          purchase_id?: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipt_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          purchase_item_id: string
          quantity: number
          receipt_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          purchase_item_id: string
          quantity?: number
          receipt_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          purchase_item_id?: string
          quantity?: number
          receipt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipt_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_purchase_item_id_fkey"
            columns: ["purchase_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          company_id: string
          created_at: string
          document: string
          id: string
          notes: string
          purchase_id: string
          received_at: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          document?: string
          id?: string
          notes?: string
          purchase_id: string
          received_at?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          document?: string
          id?: string
          notes?: string
          purchase_id?: string
          received_at?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          company_id: string
          created_at: string
          expected_date: string | null
          id: string
          notes: string
          purchased_at: string
          status: Database["public"]["Enums"]["doc_status"]
          supplier: string
          supplier_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          company_id: string
          created_at: string
          customer: string
          id: string
          season_id: string | null
          sold_at: string
          status: Database["public"]["Enums"]["doc_status"]
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer: string
          id?: string
          season_id?: string | null
          sold_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer?: string
          id?: string
          season_id?: string | null
          sold_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "crop_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_contracts: {
        Row: {
          company_id: string
          contract_number: string
          created_at: string
          customer_id: string
          end_date: string | null
          id: string
          notes: string
          product: string
          quantity: number
          start_date: string
          status: string
          total: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_number: string
          created_at?: string
          customer_id: string
          end_date?: string | null
          id?: string
          notes?: string
          product: string
          quantity?: number
          start_date?: string
          status?: string
          total?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_number?: string
          created_at?: string
          customer_id?: string
          end_date?: string | null
          id?: string
          notes?: string
          product?: string
          quantity?: number
          start_date?: string
          status?: string
          total?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          order_id: string
          quantity: number
          total: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          order_id: string
          quantity: number
          total?: number
          unit?: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string
          expected_date: string | null
          id: string
          notes: string
          order_number: string
          ordered_at: string
          status: Database["public"]["Enums"]["doc_status"]
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id: string
          expected_date?: string | null
          id?: string
          notes?: string
          order_number: string
          ordered_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string
          expected_date?: string | null
          id?: string
          notes?: string
          order_number?: string
          ordered_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_price_list_items: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          price: number
          price_list_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          price: number
          price_list_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          price?: number
          price_list_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_price_list_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "sales_price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_price_lists: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          notes: string
          status: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string
          status?: string
          updated_at?: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string
          status?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_price_lists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          document: string
          id: string
          inventory_count_id: string | null
          item_id: string
          kind: string
          moved_at: string
          notes: string
          origin: string
          quantity: number
          transfer_id: string | null
          unit_cost: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          document?: string
          id?: string
          inventory_count_id?: string | null
          item_id: string
          kind?: string
          moved_at?: string
          notes?: string
          origin?: string
          quantity?: number
          transfer_id?: string | null
          unit_cost?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          document?: string
          id?: string
          inventory_count_id?: string | null
          item_id?: string
          kind?: string
          moved_at?: string
          notes?: string
          origin?: string
          quantity?: number
          transfer_id?: string | null
          unit_cost?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_count_id_fkey"
            columns: ["inventory_count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          destination_warehouse_id: string
          document: string
          id: string
          item_id: string
          notes: string
          quantity: number
          source_warehouse_id: string
          transferred_at: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          destination_warehouse_id: string
          document?: string
          id?: string
          item_id: string
          notes?: string
          quantity: number
          source_warehouse_id: string
          transferred_at?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          destination_warehouse_id?: string
          document?: string
          id?: string
          item_id?: string
          notes?: string
          quantity?: number
          source_warehouse_id?: string
          transferred_at?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string
          bank_info: string
          category: string
          city: string
          company_id: string
          contact_name: string
          created_at: string
          document: string
          email: string
          id: string
          name: string
          notes: string
          payment_terms: string
          phone: string
          state: string
          state_registration: string
          status: string
          trade_name: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address?: string
          bank_info?: string
          category?: string
          city?: string
          company_id: string
          contact_name?: string
          created_at?: string
          document?: string
          email?: string
          id?: string
          name: string
          notes?: string
          payment_terms?: string
          phone?: string
          state?: string
          state_registration?: string
          status?: string
          trade_name?: string
          updated_at?: string
          zip_code?: string
        }
        Update: {
          address?: string
          bank_info?: string
          category?: string
          city?: string
          company_id?: string
          contact_name?: string
          created_at?: string
          document?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          state?: string
          state_registration?: string
          status?: string
          trade_name?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_permissions: {
        Row: {
          id: string
          level: Database["public"]["Enums"]["permission_level"]
          module_slug: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: Database["public"]["Enums"]["permission_level"]
          module_slug: string
          user_id: string
        }
        Update: {
          id?: string
          level?: Database["public"]["Enums"]["permission_level"]
          module_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_inventory_count: { Args: { _count_id: string }; Returns: string }
      create_inventory_count: {
        Args: {
          _company_id: string
          _counted_at: string
          _counted_quantity: number
          _item_id: string
          _notes: string
          _warehouse_id: string
        }
        Returns: string
      }
      create_stock_transfer: {
        Args: {
          _company_id: string
          _destination_warehouse_id: string
          _document: string
          _item_id: string
          _notes: string
          _quantity: number
          _source_warehouse_id: string
          _transferred_at: string
          _unit_cost: number
        }
        Returns: string
      }
      current_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_devitech_admin: { Args: never; Returns: boolean }
      stock_quantity_at: {
        Args: {
          _company_id: string
          _ignore_movement_id?: string
          _item_id: string
          _warehouse_id: string
        }
        Returns: number
      }
    }
    Enums: {
      account_status: "active" | "blocked"
      app_role: "devitech_admin" | "company_admin" | "manager" | "operator"
      doc_status: "draft" | "confirmed" | "canceled"
      entry_kind: "receivable" | "payable"
      entry_status: "open" | "paid" | "overdue" | "canceled"
      permission_level: "none" | "view" | "edit"
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
      account_status: ["active", "blocked"],
      app_role: ["devitech_admin", "company_admin", "manager", "operator"],
      doc_status: ["draft", "confirmed", "canceled"],
      entry_kind: ["receivable", "payable"],
      entry_status: ["open", "paid", "overdue", "canceled"],
      permission_level: ["none", "view", "edit"],
    },
  },
} as const
