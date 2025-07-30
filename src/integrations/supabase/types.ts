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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      assessment_conclusions: {
        Row: {
          assessment_id: string
          created_at: string
          llm_model: string | null
          objectives: string | null
          recommendations: string | null
          synthesis: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          llm_model?: string | null
          objectives?: string | null
          recommendations?: string | null
          synthesis: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          llm_model?: string | null
          objectives?: string | null
          recommendations?: string | null
          synthesis?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_conclusions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_item_results: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          item_id: string
          norm_id_used: string | null
          notes: string | null
          percentile: number | null
          position: Database["public"]["Enums"]["score_position"] | null
          raw_score: number
          standard_score: number | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          item_id: string
          norm_id_used?: string | null
          notes?: string | null
          percentile?: number | null
          position?: Database["public"]["Enums"]["score_position"] | null
          raw_score: number
          standard_score?: number | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          item_id?: string
          norm_id_used?: string | null
          notes?: string | null
          percentile?: number | null
          position?: Database["public"]["Enums"]["score_position"] | null
          raw_score?: number
          standard_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_item_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_item_results_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_item_results_norm_id_used_fkey"
            columns: ["norm_id_used"]
            isOneToOne: false
            referencedRelation: "norms"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          date: string
          id: string
          patient_id: string
          practitioner_id: string
          signed_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          template_id: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          patient_id: string
          practitioner_id: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          template_id?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          patient_id?: string
          practitioner_id?: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          template_id?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          code: string
          created_at: string
          description: string | null
          direction: Database["public"]["Enums"]["score_direction"]
          id: string
          name: string
          subtheme_id: string
          unit: string | null
          version: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["score_direction"]
          id?: string
          name: string
          subtheme_id: string
          unit?: string | null
          version?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["score_direction"]
          id?: string
          name?: string
          subtheme_id?: string
          unit?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_subtheme_id_fkey"
            columns: ["subtheme_id"]
            isOneToOne: false
            referencedRelation: "catalog_subthemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_catalog_items_subtheme"
            columns: ["subtheme_id"]
            isOneToOne: false
            referencedRelation: "catalog_subthemes"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_subthemes: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          theme_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          theme_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_subthemes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "catalog_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_catalog_subthemes_theme"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "catalog_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_themes: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      consents: {
        Row: {
          given_at: string
          guardian_id: string | null
          id: string
          patient_id: string
          revoked_at: string | null
          scope: string
        }
        Insert: {
          given_at?: string
          guardian_id?: string | null
          id?: string
          patient_id: string
          revoked_at?: string | null
          scope: string
        }
        Update: {
          given_at?: string
          guardian_id?: string | null
          id?: string
          patient_id?: string
          revoked_at?: string | null
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          legal_relation: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          legal_relation: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          legal_relation?: string
          phone?: string | null
        }
        Relationships: []
      }
      norms: {
        Row: {
          age_max_months: number
          age_min_months: number
          created_at: string
          id: string
          item_id: string
          mean: number | null
          method: Database["public"]["Enums"]["norm_method"]
          percentiles: Json | null
          sd: number | null
          source: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          age_max_months: number
          age_min_months: number
          created_at?: string
          id?: string
          item_id: string
          mean?: number | null
          method: Database["public"]["Enums"]["norm_method"]
          percentiles?: Json | null
          sd?: number | null
          source?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          age_max_months?: number
          age_min_months?: number
          created_at?: string
          id?: string
          item_id?: string
          mean?: number | null
          method?: Database["public"]["Enums"]["norm_method"]
          percentiles?: Json | null
          sd?: number | null
          source?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "norms_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          patient_id: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string
          guardian_id: string
          patient_id: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string
          guardian_id?: string
          patient_id?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_guardians_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string
          created_at: string
          created_by_user_id: string
          dossier_number: string
          first_name: string
          id: string
          last_name: string
          physician: string | null
          school: string | null
          sex: Database["public"]["Enums"]["patient_sex"]
        }
        Insert: {
          birth_date: string
          created_at?: string
          created_by_user_id: string
          dossier_number: string
          first_name: string
          id?: string
          last_name: string
          physician?: string | null
          school?: string | null
          sex: Database["public"]["Enums"]["patient_sex"]
        }
        Update: {
          birth_date?: string
          created_at?: string
          created_by_user_id?: string
          dossier_number?: string
          first_name?: string
          id?: string
          last_name?: string
          physician?: string | null
          school?: string | null
          sex?: Database["public"]["Enums"]["patient_sex"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          two_factor_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          two_factor_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          two_factor_enabled?: boolean | null
        }
        Relationships: []
      }
      template_items: {
        Row: {
          id: string
          item_id: string
          order_index: number
          template_id: string
        }
        Insert: {
          id?: string
          item_id: string
          order_index?: number
          template_id: string
        }
        Update: {
          id?: string
          item_id?: string
          order_index?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      theme_conclusions: {
        Row: {
          assessment_id: string
          confidence: number | null
          created_at: string
          text: string
          theme_id: string
        }
        Insert: {
          assessment_id: string
          confidence?: number | null
          created_at?: string
          text: string
          theme_id: string
        }
        Update: {
          assessment_id?: string
          confidence?: number | null
          created_at?: string
          text?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_conclusions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_conclusions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "catalog_themes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_or_psy: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      assessment_status: "DRAFT" | "READY_FOR_REVIEW" | "SIGNED" | "SHARED"
      document_type: "CR" | "CONSENTEMENT" | "ANNEXE"
      norm_method: "GAUSSIAN" | "PERCENTILE"
      patient_sex: "M" | "F"
      score_direction: "HIGHER_IS_BETTER" | "LOWER_IS_BETTER"
      score_position: "NORMAL" | "A_SURVEILLER" | "EN_DESSOUS"
      user_role: "ADMIN_PSY" | "PSY" | "PARENT" | "SUPERADMIN_TECH"
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
      assessment_status: ["DRAFT", "READY_FOR_REVIEW", "SIGNED", "SHARED"],
      document_type: ["CR", "CONSENTEMENT", "ANNEXE"],
      norm_method: ["GAUSSIAN", "PERCENTILE"],
      patient_sex: ["M", "F"],
      score_direction: ["HIGHER_IS_BETTER", "LOWER_IS_BETTER"],
      score_position: ["NORMAL", "A_SURVEILLER", "EN_DESSOUS"],
      user_role: ["ADMIN_PSY", "PSY", "PARENT", "SUPERADMIN_TECH"],
    },
  },
} as const
