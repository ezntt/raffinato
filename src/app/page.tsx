import { createClient } from '@/lib/supabaseServer'
import { DashboardClient } from '@/components/DashboardClient'

export const revalidate = 0

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Busca Estoque de Garrafas (Pronta Entrega)
  const { data: estoqueGarrafas } = await supabase
    .from('Estoque') 
    .select('*')

  // 2. Busca Estoque de Tanques (Lotes em andamento)
  const { data: lotes } = await supabase
    .from('Lote')
    .select('produto, volume_atual')
    .gt('volume_atual', 0)

  return (
    <DashboardClient 
      estoqueGarrafas={estoqueGarrafas || []} 
      lotes={lotes || []} 
    />
  )
}