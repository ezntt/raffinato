import { createClient } from '@/lib/supabaseServer'
import { DashboardActions } from '@/components/DashboardActions' // Importa o componente cliente

export const revalidate = 0

export default async function DashboardEstoque() {
  const supabase = await createClient()

  // 1. Buscar dados do estoque
  const { data: estoque } = await supabase.from('Estoque').select('*')

  // Função auxiliar
  const getQtd = (tipo: string, tamanho: number) => {
    const item = estoque?.find(e => e.tipo === tipo && e.tamanho === tamanho)
    return item?.quantidade || 0
  }

  // Dados organizados
  const limoncello750 = getQtd('limoncello', 750)
  const limoncello375 = getQtd('limoncello', 375)
  const arancello750 = getQtd('arancello', 750)
  const arancello375 = getQtd('arancello', 375)

  // Cálculo de Litros
  const totalLitros = (
    (limoncello750 * 0.75) + (limoncello375 * 0.375) +
    (arancello750 * 0.75) + (arancello375 * 0.375)
  ).toFixed(1)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto mt-12 md:mt-0">
      
      <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Estoque Disponível 📦</h1>
          <p className="text-gray-500 font-medium">Produtos prontos para entrega imediata</p>
        </div>
        
        <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-blue-900 font-bold flex items-center gap-3 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-blue-400">Volume Total</span>
          <span className="text-2xl font-mono">{totalLitros} L</span>
        </div>
      </header>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* === LIMONCELLO === */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-yellow-100 relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-yellow-600 mb-6 flex items-center gap-2">🍋 Limoncello</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div><span className="text-gray-400 font-bold text-xs uppercase block mb-1">Garrafa Clássica</span><span className="text-lg font-bold text-gray-700">750ml</span></div>
                <div className="text-right"><span className="text-5xl font-black text-gray-900 tracking-tighter">{limoncello750}</span><span className="text-xs text-gray-400 font-bold uppercase ml-1">un</span></div>
              </div>
              <div className="flex justify-between items-center">
                <div><span className="text-gray-400 font-bold text-xs uppercase block mb-1">Meia Garrafa</span><span className="text-lg font-bold text-gray-700">375ml</span></div>
                <div className="text-right"><span className="text-5xl font-black text-gray-900 tracking-tighter">{limoncello375}</span><span className="text-xs text-gray-400 font-bold uppercase ml-1">un</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* === ARANCELLO === */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100 relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-orange-600 mb-6 flex items-center gap-2">🍊 Arancello</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div><span className="text-gray-400 font-bold text-xs uppercase block mb-1">Garrafa Clássica</span><span className="text-lg font-bold text-gray-700">750ml</span></div>
                <div className="text-right"><span className="text-5xl font-black text-gray-900 tracking-tighter">{arancello750}</span><span className="text-xs text-gray-400 font-bold uppercase ml-1">un</span></div>
              </div>
              <div className="flex justify-between items-center">
                <div><span className="text-gray-400 font-bold text-xs uppercase block mb-1">Meia Garrafa</span><span className="text-lg font-bold text-gray-700">375ml</span></div>
                <div className="text-right"><span className="text-5xl font-black text-gray-900 tracking-tighter">{arancello375}</span><span className="text-xs text-gray-400 font-bold uppercase ml-1">un</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AQUI ESTÁ A CORREÇÃO: Usamos o componente importado */}
      <DashboardActions />

    </div>
  )
}