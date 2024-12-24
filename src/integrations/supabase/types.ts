// Base JSON type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Database interface
export interface Database {
  public: {
    Tables: {
      chat_rooms: ChatRoomsTable;
      messages: MessagesTable;
      profiles: ProfilesTable;
      users: UsersTable;
      waiting_room: WaitingRoomTable;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: DatabaseFunctions;
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Individual table interfaces
interface ChatRoomsTable {
  Row: {
    created_at: string | null;
    host_id: string | null;
    id: string;
    participants: string[];
    subject_category: string;
  };
  Insert: {
    created_at?: string | null;
    host_id?: string | null;
    id: string;
    participants: string[];
    subject_category?: string;
  };
  Update: {
    created_at?: string | null;
    host_id?: string | null;
    id?: string;
    participants?: string[];
    subject_category?: string;
  };
  Relationships: [
    {
      foreignKeyName: "chat_rooms_host_id_fkey";
      columns: ["host_id"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
    }
  ];
}

interface MessagesTable {
  Row: {
    chat_room_id: string | null;
    content: string;
    created_at: string | null;
    id: string;
    user_id: string | null;
  };
  Insert: {
    chat_room_id?: string | null;
    content: string;
    created_at?: string | null;
    id?: string;
    user_id?: string | null;
  };
  Update: {
    chat_room_id?: string | null;
    content?: string;
    created_at?: string | null;
    id?: string;
    user_id?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "messages_chat_room_id_fkey";
      columns: ["chat_room_id"];
      isOneToOne: false;
      referencedRelation: "chat_rooms";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "messages_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
    }
  ];
}

interface ProfilesTable {
  Row: {
    avatar_url: string | null;
    id: string;
    updated_at: string | null;
  };
  Insert: {
    avatar_url?: string | null;
    id: string;
    updated_at?: string | null;
  };
  Update: {
    avatar_url?: string | null;
    id?: string;
    updated_at?: string | null;
  };
  Relationships: [];
}

interface UsersTable {
  Row: {
    created_at: string | null;
    email: string | null;
    id: string;
  };
  Insert: {
    created_at?: string | null;
    email?: string | null;
    id: string;
  };
  Update: {
    created_at?: string | null;
    email?: string | null;
    id?: string;
  };
  Relationships: [];
}

interface WaitingRoomTable {
  Row: {
    created_at: string | null;
    id: string;
    user_id: string | null;
  };
  Insert: {
    created_at?: string | null;
    id?: string;
    user_id?: string | null;
  };
  Update: {
    created_at?: string | null;
    id?: string;
    user_id?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "waiting_room_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
    }
  ];
}

interface DatabaseFunctions {
  cleanup_empty_rooms: {
    Args: Record<PropertyKey, never>;
    Returns: undefined;
  };
}

// Helper types for table operations
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;