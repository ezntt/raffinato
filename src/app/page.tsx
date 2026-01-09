import { createClient } from '@/lib/supabaseServer'
import { DashboardClient } from '@/components/DashboardClient'

export const revalidate = 0 

export default async function Home() {
  const supabase = await createClient()

  // 1. Busca Lotes (Licor)
  const { data: lotes } = await supabase
    .from('Lote')
    .select('*')
    .order('created_at', { ascending: false })

  // 2. Busca Xarope (Insumo)
  const { data: insumoXarope } = await supabase
    .from('Insumo')
    .select('quantidade_atual')
    .eq('nome', 'Xarope Limão Siciliano') // Ou 'Garrafa Xarope (Cheia)' se for esse o nome
    .single()

  // Se não achar, assume 0
  const qtdXarope = insumoXarope?.quantidade_atual || 0

  return (
    <main>
      <DashboardClient 
        lotes={lotes || []} 
        estoqueXarope={qtdXarope} 
      />
    </main>
  )
}