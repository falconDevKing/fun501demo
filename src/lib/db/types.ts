export type SessionStatus = "active" | "completed";

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
      players: {
        Row: {
          auth_user_id: string;
          created_at: string;
          display_name: string;
          id: string;
          photo_public_id: string | null;
          photo_url: string | null;
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          display_name: string;
          id?: string;
          photo_public_id?: string | null;
          photo_url?: string | null;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          photo_public_id?: string | null;
          photo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          created_at: string;
          ended_at: string | null;
          id: string;
          started_at: string;
          status: SessionStatus;
          title: string;
          updated_at: string;
          video_public_id: string | null;
          video_source: "provided" | "uploaded";
          video_url: string | null;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          started_at?: string;
          status?: SessionStatus;
          title: string;
          updated_at?: string;
          video_public_id?: string | null;
          video_source?: "provided" | "uploaded";
          video_url?: string | null;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          started_at?: string;
          status?: SessionStatus;
          title?: string;
          updated_at?: string;
          video_public_id?: string | null;
          video_source?: "provided" | "uploaded";
          video_url?: string | null;
        };
        Relationships: [];
      };
      session_players: {
        Row: {
          created_at: string;
          id: string;
          player_id: string;
          score: number;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          player_id: string;
          score?: number;
          session_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          player_id?: string;
          score?: number;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_player_score_summary: {
        Args: {
          p_player_id: string;
        };
        Returns: {
          high_score: number;
          lifetime_score: number;
        }[];
      };
      update_session_player_score: {
        Args: {
          p_delta: number;
          p_player_id: string;
          p_session_id: string;
        };
        Returns: {
          error_code: string | null;
          score: number;
          success: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
