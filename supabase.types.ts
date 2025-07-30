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
      event_signups: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          status: string | null
          user_id: string | null
          waiver_submitted: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          waiver_submitted?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          waiver_submitted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "event_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_images"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_waivers"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_signups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          date: string
          description: string
          id: string
          image_id: string | null
          location: string
          time: string | null
          title: string
          waiver_id: string | null
          waiver_required: boolean
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          id?: string
          image_id?: string | null
          location: string
          time?: string | null
          title: string
          waiver_id?: string | null
          waiver_required?: boolean
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          image_id?: string | null
          location?: string
          time?: string | null
          title?: string
          waiver_id?: string | null
          waiver_required?: boolean
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_confirmed: boolean
          full_name: string
          id: string
          lead_id: string
          parent_1_email: string | null
          parent_1_name: string | null
          parent_1_phone: string | null
          parent_2_email: string | null
          parent_2_name: string | null
          parent_2_phone: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          created_at?: string | null
          email: string
          email_confirmed?: boolean
          full_name: string
          id: string
          lead_id: string
          parent_1_email?: string | null
          parent_1_name?: string | null
          parent_1_phone?: string | null
          parent_2_email?: string | null
          parent_2_name?: string | null
          parent_2_phone?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          created_at?: string | null
          email?: string
          email_confirmed?: boolean
          full_name?: string
          id?: string
          lead_id?: string
          parent_1_email?: string | null
          parent_1_name?: string | null
          parent_1_phone?: string | null
          parent_2_email?: string | null
          parent_2_name?: string | null
          parent_2_phone?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: []
      }
      volunteer_hours: {
        Row: {
          created_at: string | null
          event_id: string | null
          hours: number
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          hours: number
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          hours?: number
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_hours_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_images"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "volunteer_hours_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_waivers"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "volunteer_hours_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      website_details: {
        Row: {
          events: number
          featured_event_id: string | null
          id: number
          leadership: Json | null
          trash: number
          volunteers: number
        }
        Insert: {
          events?: number
          featured_event_id?: string | null
          id?: number
          leadership?: Json | null
          trash?: number
          volunteers?: number
        }
        Update: {
          events?: number
          featured_event_id?: string | null
          id?: number
          leadership?: Json | null
          trash?: number
          volunteers?: number
        }
        Relationships: []
      }
    }
    Views: {
      event_images: {
        Row: {
          bucket_id: string | null
          date: string | null
          event_id: string | null
          image_id: string | null
          image_path: string | null
        }
        Relationships: []
      }
      event_waivers: {
        Row: {
          bucket_id: string | null
          date: string | null
          event_id: string | null
          waiver_id: string | null
          waiver_path: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      cleanup_expired_event_images_rpc: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      delete_storage_object: {
        Args: { bucket: string; object_name: string }
        Returns: undefined
      }
      get_events_with_images: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          date: string
          image_url: string
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      approval_status: "PENDING" | "APPROVED" | "REJECTED"
      user_role: "STUDENT" | "PARENT" | "ADMIN" | "PENDING"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      approval_status: ["PENDING", "APPROVED", "REJECTED"],
      user_role: ["STUDENT", "PARENT", "ADMIN", "PENDING"],
    },
  },
} as const
