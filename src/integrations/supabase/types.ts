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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          created_at: string
          domain: string
          framework: string
          id: string
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          domain: string
          framework: string
          id?: string
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          domain?: string
          framework?: string
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          question_id: string
          response_value: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          question_id: string
          response_value?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          question_id?: string
          response_value?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          ai_summary: string | null
          assessment_id: string
          created_at: string
          domain_scores: Json | null
          id: string
          overall_score: number | null
          roadmap: Json | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          assessment_id: string
          created_at?: string
          domain_scores?: Json | null
          id?: string
          overall_score?: number | null
          roadmap?: Json | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          assessment_id?: string
          created_at?: string
          domain_scores?: Json | null
          id?: string
          overall_score?: number | null
          roadmap?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          completed_at: string | null
          created_at: string
          framework: string
          id: string
          score: number | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          framework: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          framework?: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backlog_action_progress: {
        Row: {
          action_id: string
          backlog_id: string
          completed_at: string | null
          created_at: string
          id: string
          retrospective_notes: string | null
          status: string
          success_metric_achieved: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          backlog_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          retrospective_notes?: string | null
          status?: string
          success_metric_achieved?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          backlog_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          retrospective_notes?: string | null
          status?: string
          success_metric_achieved?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_action_progress_backlog_id_fkey"
            columns: ["backlog_id"]
            isOneToOne: false
            referencedRelation: "generated_backlogs"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_generation_log: {
        Row: {
          ai_model: string | null
          assessment_id: string
          backlog_id: string | null
          budget_usd: number | null
          created_at: string
          error_message: string | null
          generation_duration_ms: number | null
          id: string
          success: boolean
          tokens_used: number | null
          transformation_driver: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          assessment_id: string
          backlog_id?: string | null
          budget_usd?: number | null
          created_at?: string
          error_message?: string | null
          generation_duration_ms?: number | null
          id?: string
          success?: boolean
          tokens_used?: number | null
          transformation_driver?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          assessment_id?: string
          backlog_id?: string | null
          budget_usd?: number | null
          created_at?: string
          error_message?: string | null
          generation_duration_ms?: number | null
          id?: string
          success?: boolean
          tokens_used?: number | null
          transformation_driver?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_generation_log_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_generation_log_backlog_id_fkey"
            columns: ["backlog_id"]
            isOneToOne: false
            referencedRelation: "generated_backlogs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_context: {
        Row: {
          additional_context: string | null
          assessment_id: string
          budget_usd: number | null
          created_at: string
          hard_constraints: string[] | null
          id: string
          target_date: string | null
          transformation_driver: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_context?: string | null
          assessment_id: string
          budget_usd?: number | null
          created_at?: string
          hard_constraints?: string[] | null
          id?: string
          target_date?: string | null
          transformation_driver: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_context?: string | null
          assessment_id?: string
          budget_usd?: number | null
          created_at?: string
          hard_constraints?: string[] | null
          id?: string
          target_date?: string | null
          transformation_driver?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_context_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_backlogs: {
        Row: {
          assessment_id: string
          backlog_data: Json
          created_at: string
          id: string
          is_customized: boolean
          original_backlog_data: Json | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          backlog_data: Json
          created_at?: string
          id?: string
          is_customized?: boolean
          original_backlog_data?: Json | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          backlog_data?: Json
          created_at?: string
          id?: string
          is_customized?: boolean
          original_backlog_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_generated_backlogs_assessment"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          annual_revenue: string | null
          cloud_providers: string[] | null
          company: string | null
          company_size: string | null
          created_at: string
          full_name: string | null
          headquarters_region: string | null
          id: string
          industry: string | null
          infrastructure_type: string | null
          onboarding_completed: boolean
          role: string | null
          tech_team_size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_revenue?: string | null
          cloud_providers?: string[] | null
          company?: string | null
          company_size?: string | null
          created_at?: string
          full_name?: string | null
          headquarters_region?: string | null
          id?: string
          industry?: string | null
          infrastructure_type?: string | null
          onboarding_completed?: boolean
          role?: string | null
          tech_team_size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_revenue?: string | null
          cloud_providers?: string[] | null
          company?: string | null
          company_size?: string | null
          created_at?: string
          full_name?: string | null
          headquarters_region?: string | null
          id?: string
          industry?: string | null
          infrastructure_type?: string | null
          onboarding_completed?: boolean
          role?: string | null
          tech_team_size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_backlogs: {
        Row: {
          backlog_data: Json
          backlog_id: string
          business_context: Json | null
          company_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          scores: Json | null
          share_token: string
          user_id: string
        }
        Insert: {
          backlog_data: Json
          backlog_id: string
          business_context?: Json | null
          company_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          scores?: Json | null
          share_token?: string
          user_id: string
        }
        Update: {
          backlog_data?: Json
          backlog_id?: string
          business_context?: Json | null
          company_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          scores?: Json | null
          share_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_shared_backlogs_backlog"
            columns: ["backlog_id"]
            isOneToOne: false
            referencedRelation: "generated_backlogs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_sprint_progress: {
        Args: { p_backlog_id: string; p_sprint_number: number }
        Returns: {
          blocked_actions: number
          completed_actions: number
          completion_percentage: number
          in_progress_actions: number
          total_actions: number
        }[]
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
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
