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
      assessment_responses: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_paid_question: boolean
          question_id: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_paid_question?: boolean
          question_id: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_paid_question?: boolean
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessment_type: string
          completed_at: string | null
          created_at: string
          id: string
          is_complete: boolean
          is_paid: boolean
          result_summary: Json | null
          user_id: string
        }
        Insert: {
          assessment_type?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          is_paid?: boolean
          result_summary?: Json | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          is_paid?: boolean
          result_summary?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      aura_sessions: {
        Row: {
          aura_summary: string | null
          challenge_text: string | null
          created_at: string
          current_step: number | null
          email: string | null
          id: string
          identified_themes: Json | null
          name: string | null
          preferred_contact: string | null
          updated_at: string
          user_confirmed: boolean | null
          user_id: string
        }
        Insert: {
          aura_summary?: string | null
          challenge_text?: string | null
          created_at?: string
          current_step?: number | null
          email?: string | null
          id?: string
          identified_themes?: Json | null
          name?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_confirmed?: boolean | null
          user_id: string
        }
        Update: {
          aura_summary?: string | null
          challenge_text?: string | null
          created_at?: string
          current_step?: number | null
          email?: string | null
          id?: string
          identified_themes?: Json | null
          name?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_confirmed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      blob_tree_assessments: {
        Row: {
          created_at: string
          current_blob: number | null
          desired_blob: number | null
          id: string
          is_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_blob?: number | null
          desired_blob?: number | null
          id?: string
          is_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_blob?: number | null
          desired_blob?: number | null
          id?: string
          is_complete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      career_strategies: {
        Row: {
          career_goals: Json | null
          created_at: string
          disc_result: Json | null
          id: string
          mbti_result: Json | null
          skill_development_plan: Json | null
          strategy: Json | null
          strengths_result: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          career_goals?: Json | null
          created_at?: string
          disc_result?: Json | null
          id?: string
          mbti_result?: Json | null
          skill_development_plan?: Json | null
          strategy?: Json | null
          strengths_result?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          career_goals?: Json | null
          created_at?: string
          disc_result?: Json | null
          id?: string
          mbti_result?: Json | null
          skill_development_plan?: Json | null
          strategy?: Json | null
          strengths_result?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_applications: {
        Row: {
          bio: string
          created_at: string
          display_name: string
          experience: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          bio: string
          created_at?: string
          display_name: string
          experience?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          bio?: string
          created_at?: string
          display_name?: string
          experience?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_assignments: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          assignment_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          assignment_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          assignment_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "coach_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string
          id: string
          specialties: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          specialties?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          specialties?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disc_assessments: {
        Row: {
          created_at: string
          current_question: number
          id: string
          is_complete: boolean
          responses: Json
          result: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_question?: number
          id?: string
          is_complete?: boolean
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_question?: number
          id?: string
          is_complete?: boolean
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mbti_assessments: {
        Row: {
          created_at: string
          current_question: number
          id: string
          is_complete: boolean
          responses: Json
          result: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_question?: number
          id?: string
          is_complete?: boolean
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_question?: number
          id?: string
          is_complete?: boolean
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      path_commitments: {
        Row: {
          chosen_path: Json
          constraints: string | null
          created_at: string
          focus_area: string | null
          id: string
          intent: string | null
          time_budget: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chosen_path: Json
          constraints?: string | null
          created_at?: string
          focus_area?: string | null
          id?: string
          intent?: string | null
          time_budget?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chosen_path?: Json
          constraints?: string | null
          created_at?: string
          focus_area?: string | null
          id?: string
          intent?: string | null
          time_budget?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      path_recommendations: {
        Row: {
          created_at: string
          id: string
          recommendations: Json
          selected_path_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recommendations?: Json
          selected_path_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recommendations?: Json
          selected_path_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_paths: {
        Row: {
          coach_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          phases: Json
          title: string
          total_progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          phases?: Json
          title: string
          total_progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          phases?: Json
          title?: string
          total_progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blob_tree_complete: boolean
          career_goals: Json | null
          challenges_complete: boolean
          created_at: string
          disc_completed: boolean
          email: string | null
          has_paid: boolean
          id: string
          last_payment_date: string | null
          mbti_completed: boolean
          onboarding_complete: boolean
          path_committed: boolean
          path_options_shown: boolean
          personal_path_generated: boolean
          reality_report_generated: boolean
          step1_completed: boolean
          strategy_generated: boolean
          strengths_completed: boolean
          subscription_end_date: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          value_map_complete: boolean
          wheel_of_life_complete: boolean
        }
        Insert: {
          blob_tree_complete?: boolean
          career_goals?: Json | null
          challenges_complete?: boolean
          created_at?: string
          disc_completed?: boolean
          email?: string | null
          has_paid?: boolean
          id?: string
          last_payment_date?: string | null
          mbti_completed?: boolean
          onboarding_complete?: boolean
          path_committed?: boolean
          path_options_shown?: boolean
          personal_path_generated?: boolean
          reality_report_generated?: boolean
          step1_completed?: boolean
          strategy_generated?: boolean
          strengths_completed?: boolean
          subscription_end_date?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          value_map_complete?: boolean
          wheel_of_life_complete?: boolean
        }
        Update: {
          blob_tree_complete?: boolean
          career_goals?: Json | null
          challenges_complete?: boolean
          created_at?: string
          disc_completed?: boolean
          email?: string | null
          has_paid?: boolean
          id?: string
          last_payment_date?: string | null
          mbti_completed?: boolean
          onboarding_complete?: boolean
          path_committed?: boolean
          path_options_shown?: boolean
          personal_path_generated?: boolean
          reality_report_generated?: boolean
          step1_completed?: boolean
          strategy_generated?: boolean
          strengths_completed?: boolean
          subscription_end_date?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          value_map_complete?: boolean
          wheel_of_life_complete?: boolean
        }
        Relationships: []
      }
      reality_reports: {
        Row: {
          blob_tree_summary: Json | null
          created_at: string
          generated_summary: string | null
          id: string
          key_constraints: Json | null
          risks: Json | null
          strengths: Json | null
          updated_at: string
          user_id: string
          value_map_summary: Json | null
        }
        Insert: {
          blob_tree_summary?: Json | null
          created_at?: string
          generated_summary?: string | null
          id?: string
          key_constraints?: Json | null
          risks?: Json | null
          strengths?: Json | null
          updated_at?: string
          user_id: string
          value_map_summary?: Json | null
        }
        Update: {
          blob_tree_summary?: Json | null
          created_at?: string
          generated_summary?: string | null
          id?: string
          key_constraints?: Json | null
          risks?: Json | null
          strengths?: Json | null
          updated_at?: string
          user_id?: string
          value_map_summary?: Json | null
        }
        Relationships: []
      }
      step1_assessments: {
        Row: {
          ai_hypothesis: Json | null
          axis_scores: Json
          biggest_challenge: string | null
          created_at: string
          id: string
          is_complete: boolean
          time_horizon: string | null
          updated_at: string
          user_current_role: string | null
          user_id: string
          user_target_role: string | null
        }
        Insert: {
          ai_hypothesis?: Json | null
          axis_scores?: Json
          biggest_challenge?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          time_horizon?: string | null
          updated_at?: string
          user_current_role?: string | null
          user_id: string
          user_target_role?: string | null
        }
        Update: {
          ai_hypothesis?: Json | null
          axis_scores?: Json
          biggest_challenge?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          time_horizon?: string | null
          updated_at?: string
          user_current_role?: string | null
          user_id?: string
          user_target_role?: string | null
        }
        Relationships: []
      }
      strengths_assessments: {
        Row: {
          created_at: string
          current_question: number
          id: string
          is_complete: boolean
          responses: Json
          result: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_question?: number
          id?: string
          is_complete?: boolean
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_question?: number
          id?: string
          is_complete?: boolean
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id?: string
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
      value_map_assessments: {
        Row: {
          created_at: string
          id: string
          is_complete: boolean
          ranked_values: Json
          selected_values: Json
          top_five: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_complete?: boolean
          ranked_values?: Json
          selected_values?: Json
          top_five?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_complete?: boolean
          ranked_values?: Json
          selected_values?: Json
          top_five?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_execution_plans: {
        Row: {
          coaching_notes: string | null
          completed_tasks: Json
          created_at: string
          current_phase: string | null
          id: string
          is_complete: boolean
          strategy_id: string | null
          tasks: Json
          updated_at: string
          user_id: string
          week_number: number
          week_start_date: string
        }
        Insert: {
          coaching_notes?: string | null
          completed_tasks?: Json
          created_at?: string
          current_phase?: string | null
          id?: string
          is_complete?: boolean
          strategy_id?: string | null
          tasks?: Json
          updated_at?: string
          user_id: string
          week_number?: number
          week_start_date?: string
        }
        Update: {
          coaching_notes?: string | null
          completed_tasks?: Json
          created_at?: string
          current_phase?: string | null
          id?: string
          is_complete?: boolean
          strategy_id?: string | null
          tasks?: Json
          updated_at?: string
          user_id?: string
          week_number?: number
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_execution_plans_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "career_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_of_life_assessments: {
        Row: {
          created_at: string
          id: string
          is_complete: boolean
          notes: string | null
          scores: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_complete?: boolean
          notes?: string | null
          scores?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_complete?: boolean
          notes?: string | null
          scores?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_admin: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_assignment_participant: {
        Args: { _assignment_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "coach"
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
      app_role: ["admin", "user", "coach"],
    },
  },
} as const
