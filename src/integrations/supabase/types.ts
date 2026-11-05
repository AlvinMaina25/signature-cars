export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      car_images: {
        Row: {
          car_id: string;
          created_at: string;
          id: string;
          image_url: string;
          sort_order: number;
        };
        Insert: {
          car_id: string;
          created_at?: string;
          id?: string;
          image_url: string;
          sort_order?: number;
        };
        Update: {
          car_id?: string;
          created_at?: string;
          id?: string;
          image_url?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey";
            columns: ["car_id"];
            isOneToOne: false;
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      cars: {
        Row: {
          badge: string | null;
          body_type: string;
          created_at: string;
          currency: string;
          description: string | null;
          drivetrain: string | null;
          engine: string | null;
          exterior_color: string | null;
          featured: boolean;
          fuel_type: string;
          highlights: string[];
          horsepower: number | null;
          id: string;
          interior_color: string | null;
          location: string;
          make: string;
          mileage: number;
          model: string;
          price: number;
          review_note: string | null;
          review_status: Database["public"]["Enums"]["review_status"];
          seller_id: string | null;
          slug: string;
          status: Database["public"]["Enums"]["car_status"];
          transmission: string;
          trim: string | null;
          updated_at: string;
          vin: string | null;
          year: number;
          zero_to_sixty: number | null;
        };
        Insert: {
          badge?: string | null;
          body_type: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          drivetrain?: string | null;
          engine?: string | null;
          exterior_color?: string | null;
          featured?: boolean;
          fuel_type: string;
          highlights?: string[];
          horsepower?: number | null;
          id?: string;
          interior_color?: string | null;
          location: string;
          make: string;
          mileage?: number;
          model: string;
          price: number;
          review_note?: string | null;
          review_status?: Database["public"]["Enums"]["review_status"];
          seller_id?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["car_status"];
          transmission: string;
          trim?: string | null;
          updated_at?: string;
          vin?: string | null;
          year: number;
          zero_to_sixty?: number | null;
        };
        Update: {
          badge?: string | null;
          body_type?: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          drivetrain?: string | null;
          engine?: string | null;
          exterior_color?: string | null;
          featured?: boolean;
          fuel_type?: string;
          highlights?: string[];
          horsepower?: number | null;
          id?: string;
          interior_color?: string | null;
          location?: string;
          make?: string;
          mileage?: number;
          model?: string;
          price?: number;
          review_note?: string | null;
          review_status?: Database["public"]["Enums"]["review_status"];
          seller_id?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["car_status"];
          transmission?: string;
          trim?: string | null;
          updated_at?: string;
          vin?: string | null;
          year?: number;
          zero_to_sixty?: number | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          car_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          car_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          car_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_car_id_fkey";
            columns: ["car_id"];
            isOneToOne: false;
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      inquiries: {
        Row: {
          car_id: string | null;
          topic: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          phone: string | null;
          status: Database["public"]["Enums"]["inquiry_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          car_id?: string | null;
          topic?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          car_id?: string | null;
          topic?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inquiries_car_id_fkey";
            columns: ["car_id"];
            isOneToOne: false;
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          car_id: string;
          created_at: string;
          currency: string;
          id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_reference: string | null;
          reservation_id: string;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          car_id: string;
          created_at?: string;
          currency?: string;
          id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_reference?: string | null;
          reservation_id: string;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          car_id?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_reference?: string | null;
          reservation_id?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_car_id_fkey";
            columns: ["car_id"];
            isOneToOne: false;
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          amount: number;
          car_id: string;
          created_at: string;
          currency: string;
          id: string;
          pickup_date: string | null;
          status: Database["public"]["Enums"]["reservation_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          car_id: string;
          created_at?: string;
          currency?: string;
          id?: string;
          pickup_date?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          car_id?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          pickup_date?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_car_id_fkey";
            columns: ["car_id"];
            isOneToOne: false;
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "customer";
      car_status: "available" | "reserved" | "sold";
      inquiry_status: "new" | "in-progress" | "answered" | "closed";
      payment_provider: "mpesa" | "stripe" | "paypal" | "bank_transfer" | "financing" | "manual";
      payment_status: "pending" | "processing" | "successful" | "failed" | "cancelled" | "refunded";
      reservation_status: "pending" | "confirmed" | "completed" | "cancelled";
      review_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      car_status: ["available", "reserved", "sold"],
      inquiry_status: ["new", "in-progress", "answered", "closed"],
      payment_provider: ["mpesa", "stripe", "paypal", "bank_transfer", "financing", "manual"],
      payment_status: ["pending", "processing", "successful", "failed", "cancelled", "refunded"],
      reservation_status: ["pending", "confirmed", "completed", "cancelled"],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
