/**
 * src/types/database.types.ts
 *
 * Auto-authoritative type contracts for every Supabase table.
 * Pass this to createClient<Database>() in src/lib/supabase.ts
 * to get fully-typed query results and insert payloads.
 *
 * Keep in sync with supabase/migrations/20260616_secure_core.sql
 * and subsequent migration files.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Shared enum literals ──────────────────────────────────────────────────────

export type UserRole        = 'job_seeker' | 'business_admin' | 'platform_super_admin'
export type JobType         = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Learnership'
export type ApplicationStatus = 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'offered'
export type Province =
  | 'Gauteng' | 'Western Cape' | 'KwaZulu-Natal' | 'Eastern Cape'
  | 'Free State' | 'Limpopo' | 'Mpumalanga' | 'North West' | 'Northern Cape' | 'Remote'
export type CompanySize     = '1-10' | '11-50' | '51-200' | '201+'
export type ContentPlatform = 'facebook' | 'twitter' | 'linkedin' | 'instagram'
export type ContentStatus   = 'draft' | 'approved' | 'published'
export type MessageStatus   = 'replied' | 'gemini_error' | 'send_error' | 'skipped'

// ── Database interface ────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {

      // ── profiles ────────────────────────────────────────────────────────────
      profiles: {
        Row: {
          id:           string
          full_name:    string
          role:         UserRole
          email:        string
          phone_number: string | null
          is_premium:   boolean
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id:           string
          full_name:    string
          role?:        UserRole
          email:        string
          phone_number?: string | null
          is_premium?:  boolean
          created_at?:  string
          updated_at?:  string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      // ── jobs ─────────────────────────────────────────────────────────────────
      jobs: {
        Row: {
          id:             string
          title:          string
          company:        string
          location:       string
          province:       Province
          type:           JobType
          salary_min:     number
          salary_max:     number
          currency:       string
          sector:         string
          seta_alignment: string | null
          description:    string
          requirements:   string[]
          posted_by:      string | null
          is_active:      boolean
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }

      // ── applications ─────────────────────────────────────────────────────────
      applications: {
        Row: {
          id:           string
          job_id:       string
          applicant_id: string
          status:       ApplicationStatus
          cv_url:       string
          cover_letter: string | null
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }

      // ── business_profiles ────────────────────────────────────────────────────
      business_profiles: {
        Row: {
          id:                  string
          company_name:        string
          registration_number: string | null
          industry:            string | null
          size:                CompanySize | null
          credits_balance:     number
          created_at:          string
        }
        Insert: Omit<Database['public']['Tables']['business_profiles']['Row'], 'created_at'>
          & { created_at?: string }
        Update: Partial<Database['public']['Tables']['business_profiles']['Insert']>
      }

      // ── marketing_content ────────────────────────────────────────────────────
      marketing_content: {
        Row: {
          id:           string
          platform:     ContentPlatform
          post_draft:   string
          week_start:   string        // ISO date YYYY-MM-DD
          generated_by: string
          status:       ContentStatus
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['marketing_content']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['marketing_content']['Insert']>
      }

      // ── whatsapp_messages ────────────────────────────────────────────────────
      whatsapp_messages: {
        Row: {
          id:           string
          from_number:  string
          user_message: string
          bot_reply:    string | null
          status:       MessageStatus
          error_detail: string | null
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['whatsapp_messages']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['whatsapp_messages']['Insert']>
      }

      // ── demo_requests ────────────────────────────────────────────────────────
      demo_requests: {
        Row: {
          id:           string
          company_name: string
          contact_name: string
          email:        string
          phone:        string | null
          industry:     string | null
          size:         string | null
          message:      string | null
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['demo_requests']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['demo_requests']['Insert']>
      }

    }

    Functions: {
      is_premium: {
        Args:    { user_id: string }
        Returns: boolean
      }
      deduct_credits: {
        Args:    { business_id: string; amount: number }
        Returns: boolean
      }
    }
  }
}
