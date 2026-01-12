import { createClient } from '@/lib/supabaseServer'
import { LotesList } from '@/components/LotesList'

export const revalidate = 0

export default async function LotesPage() {
  const supabase = await createClient()

  // Busca os lotes ordenados pela data
  const { data: lotes } = await supabase
    .from('Lote')
    .select('*')
    .gt('volume_atual', 0) // Só mostra lotes que têm líquido
    .order('data_inicio', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto mt-12 md:mt-0">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Maceração e Maturação</h1>
      </header>

      {/* Passamos os dados para o Client Component */}
      <LotesList initialLotes={lotes || []} />
    </div>
  )
}