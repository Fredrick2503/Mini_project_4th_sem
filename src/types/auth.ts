
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  google_linked: boolean;
  google_refresh_token: string | null;
  google_access_token?: string | null;
  google_token_expires_at?: number | null;
  created_at: string;
  updated_at: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
}
