import { createBrowserClient } from '@supabase/ssr'

// Cria um singleton para o cliente do navegador
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)