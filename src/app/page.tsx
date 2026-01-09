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

  // 2. Busca Xarope (Nova Tabela)
  // Como só tem 1 linha, usamos single()
  const { data: dadosXarope } = await supabase
    .from('EstoqueXarope')
    .select('quantidade')
    .single()

  const qtdXarope = dadosXarope?.quantidade || 0

  return (
    <main>
      <DashboardClient 
        lotes={lotes || []} 
        estoqueXarope={qtdXarope} 
      />
    </main>
  )
}