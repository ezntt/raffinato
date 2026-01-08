import { createClient } from '@/lib/supabaseServer'
import { InsumosList } from '@/components/InsumosList'

export const revalidate = 0

export default async function InsumosPage() {
  const supabase = await createClient()

  // 1. Busca Estoque Atual
  const { data: insumos } = await supabase
    .from('Insumo')
    .select('*')
    .order('nome')

  // 2. Busca Histórico de Compras (Novo!)
  const { data: historico } = await supabase
    .from('MovimentacaoInsumo')
    .select(`
      *,
      Insumo ( nome, unidade )
    `)
    .eq('tipo', 'compra') // Só queremos compras, não ajustes ou produção
    .order('data_movimento', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto mt-12 md:mt-0 mb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Estoque de Insumos</h1>
      </header>

      <InsumosList 
        insumos={insumos || []} 
        historico={historico || []} 
      />
    </div>
  )
}