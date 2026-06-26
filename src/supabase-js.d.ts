import { AuthUser } from '@supabase/auth-js'

declare module '@supabase/supabase-js' {
  export type User = AuthUser
}
