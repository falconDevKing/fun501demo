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
          high_score: number;
          id: string;
          lifetime_score: number;
          photo_url: string | null;
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          display_name: string;
          high_score?: number;
          id?: string;
          lifetime_score?: number;
          photo_url?: string | null;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          display_name?: string;
          high_score?: number;
          id?: string;
          lifetime_score?: number;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
