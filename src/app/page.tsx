import { createClient } from '@/lib/supabaseServer'
import { DashboardClient } from '@/components/DashboardClient'

export const revalidate = 0

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Busca Estoque APENAS nos Lotes (Fonte única da verdade)
  const { data: lotes } = await supabase
    .from('Lote')
    .select('produto, volume_atual, estoque_750, estoque_375, qtd_garrafas_750, qtd_garrafas_375')
    // Filtra lotes que tenham líquido OU garrafas em estoque
    .or('volume_atual.gt.0,estoque_750.gt.0,estoque_375.gt.0')

  return (
    <DashboardClient 
      lotes={lotes || []} 
    />
  )
}