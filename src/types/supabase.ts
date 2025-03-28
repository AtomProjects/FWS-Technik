export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      event_notes: {
        Row: {
          content: string;
          created_at: string;
          created_by: string;
          event_id: string | null;
          id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          created_by: string;
          event_id?: string | null;
          id?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by?: string;
          event_id?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_notes_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          contact_info: string | null;
          contact_persons: string[] | null;
          created_at: string;
          date: string;
          time: string | null;
          id: string;
          location: string;
          main_contact: string | null;
          name: string;
        };
        Insert: {
          contact_info?: string | null;
          contact_persons?: string[] | null;
          created_at?: string;
          date: string;
          time?: string | null;
          id?: string;
          location: string;
          main_contact?: string | null;
          name: string;
        };
        Update: {
          contact_info?: string | null;
          contact_persons?: string[] | null;
          created_at?: string;
          date?: string;
          time?: string | null;
          id?: string;
          location?: string;
          main_contact?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          cable_length: number | null;
          cable_type: string | null;
          category: string;
          created_at: string;
          created_by: string;
          has_dmx: boolean | null;
          has_tuv: boolean | null;
          id: string;
          is_functional: boolean | null;
          location: string;
          marking: string;
          name: string | null;
        };
        Insert: {
          cable_length?: number | null;
          cable_type?: string | null;
          category: string;
          created_at?: string;
          created_by: string;
          has_dmx?: boolean | null;
          has_tuv?: boolean | null;
          id?: string;
          is_functional?: boolean | null;
          location: string;
          marking: string;
          name?: string | null;
        };
        Update: {
          cable_length?: number | null;
          cable_type?: string | null;
          category?: string;
          created_at?: string;
          created_by?: string;
          has_dmx?: boolean | null;
          has_tuv?: boolean | null;
          id?: string;
          is_functional?: boolean | null;
          location?: string;
          marking?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      shopping_items: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          link: string | null;
          name: string;
          price: number | null;
          priority: number | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          link?: string | null;
          name: string;
          price?: number | null;
          priority?: number | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          link?: string | null;
          name?: string;
          price?: number | null;
          priority?: number | null;
        };
        Relationships: [];
      };
      shopping_notes: {
        Row: {
          content: string;
          created_at: string | null;
          created_by: string;
          id: string;
          shopping_item_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          created_by: string;
          id?: string;
          shopping_item_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          created_by?: string;
          id?: string;
          shopping_item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_notes_shopping_item_id_fkey";
            columns: ["shopping_item_id"];
            isOneToOne: false;
            referencedRelation: "shopping_items";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          id: string;
          is_teacher: boolean | null;
          password: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_teacher?: boolean | null;
          password: string;
          username: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_teacher?: boolean | null;
          password?: string;
          username?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
