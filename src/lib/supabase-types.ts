
import { Database as BaseDatabase } from '@/integrations/supabase/types';

// Extend the base database type with our tables
export interface Database extends BaseDatabase {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string | null;
          google_course_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description: string;
          thumbnail_url?: string | null;
          google_course_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          thumbnail_url?: string | null;
          google_course_id?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          role?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      course_materials: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string;
          content_type: 'document' | 'video' | 'link' | 'assignment';
          content_url: string;
          google_material_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          title: string;
          description: string;
          content_type: 'document' | 'video' | 'link' | 'assignment';
          content_url: string;
          google_material_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          content_type?: 'document' | 'video' | 'link' | 'assignment';
          content_url?: string;
          google_material_id?: string | null;
          updated_at?: string;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          student_id: string;
          course_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          student_id?: string;
          course_id?: string;
          updated_at?: string;
        };
      };
    };
    Views: BaseDatabase['public']['Views'];
    Functions: BaseDatabase['public']['Functions'];
    Enums: BaseDatabase['public']['Enums'];
    CompositeTypes: BaseDatabase['public']['CompositeTypes'];
  };
}
