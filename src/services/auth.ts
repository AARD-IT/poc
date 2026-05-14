import { getSupabase, tryGetSupabase } from '@/lib/supabase/client'

export interface SignUpPayload {
  email: string
  password: string
  name: string
  company: string
  phone: string
  designation: string
  industry: string
  useCase: string
}

export async function signUpWithProfile(payload: SignUpPayload): Promise<{ needsEmailConfirmation: boolean }> {
  const supabase = tryGetSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.name,
        company_name: payload.company,
        phone: payload.phone,
        designation: payload.designation,
        industry: payload.industry,
        use_case: payload.useCase,
      },
    },
  })
  if (error) throw error

  // public.users row is created by DB trigger `on_auth_user_created` (see supabase/migrations).
  // That avoids RLS failures when "Confirm email" is on and there is no session/JWT yet.

  return { needsEmailConfirmation: !data.session }
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw error
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
  if (error) throw error
}
