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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approved_emails: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      incident_officers: {
        Row: {
          id: string
          incident_id: string | null
          officer_name: string
          role: string | null
        }
        Insert: {
          id?: string
          incident_id?: string | null
          officer_name: string
          role?: string | null
        }
        Update: {
          id?: string
          incident_id?: string | null
          officer_name?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_officers_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_suspects: {
        Row: {
          charges: string | null
          cid: string | null
          confiscated_items: string | null
          evidences: string | null
          fine: number | null
          id: string
          incident_id: string | null
          is_hut: boolean | null
          jail: number | null
          mugshot: string | null
          name: string
          plead: string | null
          status: string | null
          tag: string | null
        }
        Insert: {
          charges?: string | null
          cid?: string | null
          confiscated_items?: string | null
          evidences?: string | null
          fine?: number | null
          id?: string
          incident_id?: string | null
          is_hut?: boolean | null
          jail?: number | null
          mugshot?: string | null
          name: string
          plead?: string | null
          status?: string | null
          tag?: string | null
        }
        Update: {
          charges?: string | null
          cid?: string | null
          confiscated_items?: string | null
          evidences?: string | null
          fine?: number | null
          id?: string
          incident_id?: string | null
          is_hut?: boolean | null
          jail?: number | null
          mugshot?: string | null
          name?: string
          plead?: string | null
          status?: string | null
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_suspects_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_vehicles: {
        Row: {
          back_image: string | null
          color: string | null
          front_image: string | null
          id: string
          incident_id: string | null
          plate: string | null
          plate_image: string | null
          registered_owner: string | null
          vehicle_name: string
        }
        Insert: {
          back_image?: string | null
          color?: string | null
          front_image?: string | null
          id?: string
          incident_id?: string | null
          plate?: string | null
          plate_image?: string | null
          registered_owner?: string | null
          vehicle_name: string
        }
        Update: {
          back_image?: string | null
          color?: string | null
          front_image?: string | null
          id?: string
          incident_id?: string | null
          plate?: string | null
          plate_image?: string | null
          registered_owner?: string | null
          vehicle_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_vehicles_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string | null
          created_by: string | null
          custom_location: string | null
          description: string | null
          id: string
          incident_type: string
          location: string
          notes: string | null
          pursuit_initiator: string | null
          pursuit_occurred: boolean | null
          pursuit_reason: string | null
          pursuit_termination: string | null
          pursuit_type: string | null
          report_content: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custom_location?: string | null
          description?: string | null
          id?: string
          incident_type: string
          location: string
          notes?: string | null
          pursuit_initiator?: string | null
          pursuit_occurred?: boolean | null
          pursuit_reason?: string | null
          pursuit_termination?: string | null
          pursuit_type?: string | null
          report_content?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custom_location?: string | null
          description?: string | null
          id?: string
          incident_type?: string
          location?: string
          notes?: string | null
          pursuit_initiator?: string | null
          pursuit_occurred?: boolean | null
          pursuit_reason?: string | null
          pursuit_termination?: string | null
          pursuit_type?: string | null
          report_content?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badge_number: string | null
          created_at: string | null
          discord: string | null
          division: string | null
          first_name: string
          ic_phone: string | null
          id: string
          last_name: string
          license_id: string | null
          rank: string | null
          state_id: string | null
          status: string | null
          steam_name: string | null
          steam_url: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          badge_number?: string | null
          created_at?: string | null
          discord?: string | null
          division?: string | null
          first_name: string
          ic_phone?: string | null
          id: string
          last_name: string
          license_id?: string | null
          rank?: string | null
          state_id?: string | null
          status?: string | null
          steam_name?: string | null
          steam_url?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          badge_number?: string | null
          created_at?: string | null
          discord?: string | null
          division?: string | null
          first_name?: string
          ic_phone?: string | null
          id?: string
          last_name?: string
          license_id?: string | null
          rank?: string | null
          state_id?: string | null
          status?: string | null
          steam_name?: string | null
          steam_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sop_articles: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          id: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_approved_email: {
        Args: { email_input: string; user_id_input: string }
        Returns: boolean
      }
      use_invitation_code: {
        Args: { code_input: string; user_id_input: string }
        Returns: boolean
      }
      validate_email_access: { Args: { email_input: string }; Returns: boolean }
      validate_invitation_code: {
        Args: { code_input: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patrol" | "ftd" | "high_command"
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
      app_role: ["patrol", "ftd", "high_command"],
    },
  },
} as const
