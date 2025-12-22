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
      profiles: {
        Row: {
          career_goals: Json | null
          created_at: string
          disc_completed: boolean
          email: string | null
          has_paid: boolean
          id: string
          mbti_completed: boolean
          step1_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          career_goals?: Json | null
          created_at?: string
          disc_completed?: boolean
          email?: string | null
          has_paid?: boolean
          id?: string
          mbti_completed?: boolean
          step1_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          career_goals?: Json | null
          created_at?: string
          disc_completed?: boolean
          email?: string | null
          has_paid?: boolean
          id?: string
          mbti_completed?: boolean
          step1_completed?: boolean
          updated_at?: string
          user_id?: string
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
