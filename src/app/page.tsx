import { createClient } from '@/lib/supabaseServer'
import { DashboardClient } from '@/components/DashboardClient'

export const revalidate = 0

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Busca Estoque Geral (Legado/Misto)
  const { data: estoqueGarrafas } = await supabase
    .from('Estoque') 
    .select('*')

  // 2. Busca Estoque NOS LOTES (Correção aqui: trocamos qtd_garrafas por estoque_)
  const { data: lotes } = await supabase
    .from('Lote')
    .select('produto, volume_atual, estoque_750, estoque_375') // <--- MUDOU AQUI
    // Filtra lotes que tenham líquido OU garrafas em estoque
    .or('volume_atual.gt.0,estoque_750.gt.0,estoque_375.gt.0')

  return (
    <DashboardClient 
      estoqueGarrafas={estoqueGarrafas || []} 
      lotes={lotes || []} 
    />
  )
}