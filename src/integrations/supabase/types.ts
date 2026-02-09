export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          id: string
          okr_id: string
          date: string
          cadence: Database["public"]["Enums"]["cadence_type"]
          progress: number
          confidence: number
          confidence_label: Database["public"]["Enums"]["confidence_label"]
          reason_for_change: string | null
          optional_note: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          okr_id: string
          date?: string
          cadence?: Database["public"]["Enums"]["cadence_type"]
          progress?: number
          confidence?: number
          confidence_label?: Database["public"]["Enums"]["confidence_label"]
          reason_for_change?: string | null
          optional_note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          okr_id?: string
          date?: string
          cadence?: Database["public"]["Enums"]["cadence_type"]
          progress?: number
          confidence?: number
          confidence_label?: Database["public"]["Enums"]["confidence_label"]
          reason_for_change?: string | null
          optional_note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string
          id: string
          name: string
          product_area_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_area_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_area_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_product_area_id_fkey"
            columns: ["product_area_id"]
            isOneToOne: false
            referencedRelation: "product_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      jira_links: {
        Row: {
          id: string
          okr_id: string
          epic_identifier_or_url: string
          created_at: string
        }
        Insert: {
          id?: string
          okr_id: string
          epic_identifier_or_url: string
          created_at?: string
        }
        Update: {
          id?: string
          okr_id?: string
          epic_identifier_or_url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jira_links_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          id: string
          okr_id: string
          text: string
          target_value: number
          current_value: number
          needs_attention: boolean
          attention_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          okr_id: string
          text: string
          target_value?: number
          current_value?: number
          needs_attention?: boolean
          attention_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          okr_id?: string
          text?: string
          target_value?: number
          current_value?: number
          needs_attention?: boolean
          attention_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_links: {
        Row: {
          id: string
          parent_okr_id: string
          child_okr_id: string
          created_at: string
        }
        Insert: {
          id?: string
          parent_okr_id: string
          child_okr_id: string
          created_at?: string
        }
        Update: {
          id?: string
          parent_okr_id?: string
          child_okr_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "okr_links_parent_okr_id_fkey"
            columns: ["parent_okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_links_child_okr_id_fkey"
            columns: ["child_okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      okrs: {
        Row: {
          id: string
          organization_id: string
          level: Database["public"]["Enums"]["okr_level"]
          owner_id: string
          quarter: string
          year: number
          quarter_num: Database["public"]["Enums"]["quarter_label"]
          objective_text: string
          parent_okr_id: string | null
          is_rolled_over: boolean
          rolled_over_from: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          level: Database["public"]["Enums"]["okr_level"]
          owner_id: string
          quarter: string
          year: number
          quarter_num: Database["public"]["Enums"]["quarter_label"]
          objective_text: string
          parent_okr_id?: string | null
          is_rolled_over?: boolean
          rolled_over_from?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          level?: Database["public"]["Enums"]["okr_level"]
          owner_id?: string
          quarter?: string
          year?: number
          quarter_num?: Database["public"]["Enums"]["quarter_label"]
          objective_text?: string
          parent_okr_id?: string | null
          is_rolled_over?: boolean
          rolled_over_from?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "okrs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okrs_parent_okr_id_fkey"
            columns: ["parent_okr_id"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okrs_rolled_over_from_fkey"
            columns: ["rolled_over_from"]
            isOneToOne: false
            referencedRelation: "okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          setup_complete: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          setup_complete?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          setup_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      product_areas: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          cadence: string | null
          created_at: string
          domain_id: string
          id: string
          name: string
          pm_name: string | null
          updated_at: string
        }
        Insert: {
          cadence?: string | null
          created_at?: string
          domain_id: string
          id?: string
          name: string
          pm_name?: string | null
          updated_at?: string
        }
        Update: {
          cadence?: string | null
          created_at?: string
          domain_id?: string
          id?: string
          name?: string
          pm_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
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
      get_okr_organization_id: { Args: { _okr_id: string }; Returns: string }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member"
      cadence_type: "weekly" | "biweekly"
      confidence_label: "High" | "Medium" | "Low"
      okr_level: "productArea" | "domain" | "team"
      quarter_label: "Q1" | "Q2" | "Q3" | "Q4"
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
      app_role: ["admin", "member"],
      cadence_type: ["weekly", "biweekly"],
      confidence_label: ["High", "Medium", "Low"],
      okr_level: ["productArea", "domain", "team"],
      quarter_label: ["Q1", "Q2", "Q3", "Q4"],
    },
  },
} as const