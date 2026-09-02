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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          preferred_weight_unit: Database["public"]["Enums"]["weight_unit"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          preferred_weight_unit?: Database["public"]["Enums"]["weight_unit"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_weight_unit?: Database["public"]["Enums"]["weight_unit"]
          updated_at?: string
        }
        Relationships: []
      }
      progression_recommendations: {
        Row: {
          action: Database["public"]["Enums"]["progression_action"]
          created_at: string
          engine_version: string
          explanation: string
          id: string
          input_snapshot: Json
          reason: Database["public"]["Enums"]["progression_reason"]
          recommended_max_reps: number | null
          recommended_min_reps: number | null
          recommended_rir: number | null
          recommended_weight_lbs: number | null
          user_id: string
          workout_session_exercise_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["progression_action"]
          created_at?: string
          engine_version: string
          explanation: string
          id?: string
          input_snapshot?: Json
          reason: Database["public"]["Enums"]["progression_reason"]
          recommended_max_reps?: number | null
          recommended_min_reps?: number | null
          recommended_rir?: number | null
          recommended_weight_lbs?: number | null
          user_id: string
          workout_session_exercise_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["progression_action"]
          created_at?: string
          engine_version?: string
          explanation?: string
          id?: string
          input_snapshot?: Json
          reason?: Database["public"]["Enums"]["progression_reason"]
          recommended_max_reps?: number | null
          recommended_min_reps?: number | null
          recommended_rir?: number | null
          recommended_weight_lbs?: number | null
          user_id?: string
          workout_session_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progression_recommendations_user_session_exercise_fk"
            columns: ["user_id", "workout_session_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "progression_recommendations_workout_session_exercise_id_fkey"
            columns: ["workout_session_exercise_id"]
            isOneToOne: true
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      strength_records: {
        Row: {
          created_at: string
          id: string
          performed_at: string
          previous_record_id: string | null
          record_type: Database["public"]["Enums"]["strength_record_type"]
          user_id: string
          value: number
          value_unit: Database["public"]["Enums"]["strength_record_value_unit"]
          workout_session_exercise_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          performed_at: string
          previous_record_id?: string | null
          record_type: Database["public"]["Enums"]["strength_record_type"]
          user_id: string
          value: number
          value_unit: Database["public"]["Enums"]["strength_record_value_unit"]
          workout_session_exercise_id: string
        }
        Update: {
          created_at?: string
          id?: string
          performed_at?: string
          previous_record_id?: string | null
          record_type?: Database["public"]["Enums"]["strength_record_type"]
          user_id?: string
          value?: number
          value_unit?: Database["public"]["Enums"]["strength_record_value_unit"]
          workout_session_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strength_records_previous_record_fk"
            columns: ["user_id", "previous_record_id"]
            isOneToOne: false
            referencedRelation: "strength_records"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "strength_records_user_session_exercise_fk"
            columns: ["user_id", "workout_session_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "strength_records_workout_session_exercise_id_fkey"
            columns: ["workout_session_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          exercise_name_snapshot: string
          id: string
          max_reps: number
          min_reps: number
          planned_normalized_weight_lbs: number
          planned_weight_unit: Database["public"]["Enums"]["weight_unit"]
          planned_weight_value: number
          position: number
          target_sets: number
          updated_at: string
          user_id: string
          weight_increment_lbs: number
          workout_session_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          exercise_name_snapshot: string
          id?: string
          max_reps: number
          min_reps: number
          planned_normalized_weight_lbs: number
          planned_weight_unit: Database["public"]["Enums"]["weight_unit"]
          planned_weight_value: number
          position: number
          target_sets: number
          updated_at?: string
          user_id: string
          weight_increment_lbs: number
          workout_session_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          exercise_name_snapshot?: string
          id?: string
          max_reps?: number
          min_reps?: number
          planned_normalized_weight_lbs?: number
          planned_weight_unit?: Database["public"]["Enums"]["weight_unit"]
          planned_weight_value?: number
          position?: number
          target_sets?: number
          updated_at?: string
          user_id?: string
          weight_increment_lbs?: number
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_exercises_user_session_fk"
            columns: ["user_id", "workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "workout_session_exercises_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          started_at: string
          status: Database["public"]["Enums"]["workout_session_status"]
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["workout_session_status"]
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["workout_session_status"]
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          created_at: string
          difficulty: number | null
          id: string
          kind: Database["public"]["Enums"]["set_kind"]
          normalized_weight_lbs: number
          pain: boolean
          performed_at: string
          position: number
          reps: number
          rir: number | null
          updated_at: string
          user_id: string
          weight_unit: Database["public"]["Enums"]["weight_unit"]
          weight_value: number
          workout_session_exercise_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["set_kind"]
          normalized_weight_lbs: number
          pain?: boolean
          performed_at?: string
          position: number
          reps: number
          rir?: number | null
          updated_at?: string
          user_id: string
          weight_unit: Database["public"]["Enums"]["weight_unit"]
          weight_value: number
          workout_session_exercise_id: string
        }
        Update: {
          created_at?: string
          difficulty?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["set_kind"]
          normalized_weight_lbs?: number
          pain?: boolean
          performed_at?: string
          position?: number
          reps?: number
          rir?: number | null
          updated_at?: string
          user_id?: string
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
          weight_value?: number
          workout_session_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_user_session_exercise_fk"
            columns: ["user_id", "workout_session_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "workout_sets_workout_session_exercise_id_fkey"
            columns: ["workout_session_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          created_at: string
          default_normalized_weight_lbs: number
          default_weight_unit: Database["public"]["Enums"]["weight_unit"]
          default_weight_value: number
          exercise_id: string
          id: string
          max_reps: number
          min_reps: number
          position: number
          target_sets: number
          template_id: string
          updated_at: string
          user_id: string
          weight_increment_lbs: number
        }
        Insert: {
          created_at?: string
          default_normalized_weight_lbs: number
          default_weight_unit: Database["public"]["Enums"]["weight_unit"]
          default_weight_value: number
          exercise_id: string
          id?: string
          max_reps: number
          min_reps: number
          position: number
          target_sets: number
          template_id: string
          updated_at?: string
          user_id: string
          weight_increment_lbs: number
        }
        Update: {
          created_at?: string
          default_normalized_weight_lbs?: number
          default_weight_unit?: Database["public"]["Enums"]["weight_unit"]
          default_weight_value?: number
          exercise_id?: string
          id?: string
          max_reps?: number
          min_reps?: number
          position?: number
          target_sets?: number
          template_id?: string
          updated_at?: string
          user_id?: string
          weight_increment_lbs?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_user_template_fk"
            columns: ["user_id", "template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
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
      complete_workout_with_recommendations: {
        Args: {
          p_completed_at: string
          p_recommendations?: Json
          p_session_id: string
        }
        Returns: undefined
      }
      provision_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      start_workout_from_template: {
        Args: {
          p_active_session_id_to_cancel?: string | null
          p_template_id: string
        }
        Returns: string
      }
    }
    Enums: {
      progression_action: "increase" | "maintain" | "reduce" | "review"
      progression_reason:
        | "pain_recorded"
        | "incomplete_target_sets"
        | "top_of_rep_range"
        | "capacity_supports_increase"
        | "increment_exceeds_capacity"
        | "high_effort"
        | "within_rep_range"
        | "single_set_below_range"
        | "repeated_underperformance"
        | "default_maintain"
      set_kind: "warmup" | "working" | "backoff" | "drop"
      strength_record_type:
        | "highest_weight"
        | "highest_estimated_one_rep_max"
        | "highest_volume"
      strength_record_value_unit: "lb" | "lb_reps"
      weight_unit: "lb" | "kg"
      workout_session_status: "in_progress" | "completed" | "cancelled"
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
      progression_action: ["increase", "maintain", "reduce", "review"],
      progression_reason: [
        "pain_recorded",
        "incomplete_target_sets",
        "top_of_rep_range",
        "capacity_supports_increase",
        "increment_exceeds_capacity",
        "high_effort",
        "within_rep_range",
        "single_set_below_range",
        "repeated_underperformance",
        "default_maintain",
      ],
      set_kind: ["warmup", "working", "backoff", "drop"],
      strength_record_type: [
        "highest_weight",
        "highest_estimated_one_rep_max",
        "highest_volume",
      ],
      strength_record_value_unit: ["lb", "lb_reps"],
      weight_unit: ["lb", "kg"],
      workout_session_status: ["in_progress", "completed", "cancelled"],
    },
  },
} as const
