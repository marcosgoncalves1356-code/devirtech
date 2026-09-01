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
      companies: {
        Row: {
          created_at: string
          document: string | null
          enabled_modules: string[]
          id: string
          name: string
          segment: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          enabled_modules?: string[]
          id?: string
          name: string
          segment?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          enabled_modules?: string[]
          id?: string
          name?: string
          segment?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          description: string
          due_date: string
          id: string
          kind: Database["public"]["Enums"]["entry_kind"]
          paid_at: string | null
          status: Database["public"]["Enums"]["entry_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          company_id: string
          created_at?: string
          description: string
          due_date?: string
          id?: string
          kind: Database["public"]["Enums"]["entry_kind"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["entry_kind"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
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
        ]
      }
      inventory_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          min_quantity: number
          name: string
          quantity: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
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
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          must_change_password: boolean
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          username: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          must_change_password?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          must_change_password?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          company_id: string
          created_at: string
          id: string
          purchased_at: string
          status: Database["public"]["Enums"]["doc_status"]
          supplier: string
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier: string
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier?: string
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
        ]
      }
      sales: {
        Row: {
          company_id: string
          created_at: string
          customer: string
          id: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_devitech_admin: { Args: never; Returns: boolean }
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
      account_status: ["active", "blocked"],
      app_role: ["devitech_admin", "company_admin", "manager", "operator"],
      doc_status: ["draft", "confirmed", "canceled"],
      entry_kind: ["receivable", "payable"],
      entry_status: ["open", "paid", "overdue", "canceled"],
      permission_level: ["none", "view", "edit"],
    },
  },
} as const
