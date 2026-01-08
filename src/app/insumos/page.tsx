import { createClient } from '@/lib/supabaseServer'
import { InsumosList } from '@/components/InsumosList'

export const revalidate = 0

export default async function InsumosPage() {
  const supabase = await createClient()

  // 1. Busca Estoque (Sem ordem fixa do banco, ordenaremos no código)
  const { data: insumosData } = await supabase
    .from('Insumo')
    .select('*')

  // === LÓGICA DE ORDENAÇÃO INTELIGENTE ===
  // Define pesos para os itens (Quanto menor, mais no topo aparece)
  const getPriority = (nome: string) => {
    const n = nome.toLowerCase()
    
    // EMBALAGENS (Prioridade Máxima conforme seu pedido)
    if (n.includes('garrafa')) return 1
    if (n.includes('rótulo') || n.includes('rotulo')) return 2
    if (n.includes('tampa')) return 3
    if (n.includes('lacre')) return 4
    
    // INGREDIENTES (Também merecem destaque)
    if (n.includes('álcool') || n.includes('alcool')) return 1
    if (n.includes('açúcar') || n.includes('acucar')) return 2
    if (n.includes('limão') || n.includes('limao')) return 3
    if (n.includes('laranja')) return 3
    
    // Resto vai pro final
    return 99
  }

  // Ordena o array
  const insumosSorted = insumosData?.sort((a, b) => {
    const prioA = getPriority(a.nome)
    const prioB = getPriority(b.nome)
    
    // Se a prioridade for diferente, ganha quem tem menor número (mais importante)
    if (prioA !== prioB) return prioA - prioB
    
    // Se a prioridade for igual (ex: dois tipos de garrafa), ordena alfabeticamente
    return a.nome.localeCompare(b.nome)
  }) || []

  // 2. Busca Histórico de Compras (Mantido igual)
  const { data: historico } = await supabase
    .from('MovimentacaoInsumo')
    .select(`
      *,
      Insumo ( nome, unidade )
    `)
    .eq('tipo', 'compra')
    .order('data_movimento', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto mt-12 md:mt-0 mb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Estoque de Insumos</h1>
      </header>

      <InsumosList 
        insumos={insumosSorted} 
        historico={historico || []} 
      />
    </div>
  )
}