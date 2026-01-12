import { createClient } from '@/lib/supabaseServer'
import { DashboardClient } from '@/components/DashboardClient'

export const revalidate = 0 

export default async function Home() {
  const supabase = await createClient()

  // 1. Busca Lotes (Necessário para ver o volume nos TANQUES)
  const { data: lotes } = await supabase
    .from('Lote')
    .select('*')
    .neq('status', 'finalizado') 
    .order('created_at', { ascending: false })

  // 2. Busca o Estoque Unificado (NOVO)
  // Substitui a lógica de buscar xarope separado ou somar lotes manualmente
  const { data: estoque } = await supabase
    .from('EstoqueProdutos')
    .select('*')

  return (
    <main>
      <DashboardClient 
        lotes={lotes || []} 
        estoque={estoque || []} 
      />
    </main>
  )
}