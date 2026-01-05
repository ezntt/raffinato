import { createClient } from '@/lib/supabaseServer' // Usando sua config de server-side
import { redirect } from 'next/navigation'

// Função para calcular dias restantes
function getDiasRestantes(dataPrevisao: string) {
  const hoje = new Date()
  const previsao = new Date(dataPrevisao)
  const diffTime = previsao.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default async function LotesPage() {
  const supabase = await createClient()

  // Busca apenas os lotes que NÃO estão finalizados
  // Ordena do mais antigo para o mais novo (o que vence primeiro aparece em cima)
  const { data: lotes } = await supabase
    .from('Lote')
    .select('*')
    .neq('status', 'finalizado') 
    .order('data_previsao', { ascending: true })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-yellow-600 tracking-tight">Lotes em Produção 🍋</h1>
          <p className="text-gray-500 font-medium">Controle de Infusão e Maturação</p>
        </div>
        <a 
          href="/calculadora" 
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-md"
        >
          + Novo Lote
        </a>
      </header>

      {/* Se não tiver lotes, mostra aviso */}
      {(!lotes || lotes.length === 0) && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium text-lg">Nenhum lote em produção no momento.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lotes?.map((lote) => {
          const diasRestantes = getDiasRestantes(lote.data_previsao)
          const isPronto = diasRestantes <= 0
          const isLimoncello = lote.produto === 'limoncello'

          return (
            <div 
              key={lote.id} 
              className={`relative bg-white p-6 rounded-2xl shadow-sm border-2 transition-all hover:shadow-md ${
                isPronto ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-100'
              }`}
            >
              {/* Badge de Status */}
              <div className="absolute top-4 right-4">
                {isPronto ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
                    Pronto para Filtrar
                  </span>
                ) : (
                  <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Em Infusão ({diasRestantes} dias)
                  </span>
                )}
              </div>

              {/* Cabeçalho do Card */}
              <div className="mb-4">
                <span className="text-xs font-bold text-gray-400 block mb-1">LOTE #{lote.id}</span>
                <h2 className={`text-2xl font-black capitalize ${isLimoncello ? 'text-yellow-500' : 'text-orange-500'}`}>
                  {lote.produto}
                </h2>
              </div>

              {/* Detalhes de Quantidade */}
              <div className="bg-gray-50 p-3 rounded-xl mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Garrafas 750ml</span>
                  <span className="font-bold text-gray-800">{lote.qtd_garrafas_750} un</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Garrafas 375ml</span>
                  <span className="font-bold text-gray-800">{lote.qtd_garrafas_375} un</span>
                </div>
              </div>

              {/* Datas */}
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <div>
                  <span>Início:</span>
                  <span className="block text-gray-600">
                    {new Date(lote.data_inicio).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="text-right">
                  <span>Previsão:</span>
                  <span className={`block ${isPronto ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                    {new Date(lote.data_previsao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Botão de Ação (Só aparece se estiver pronto) */}
              {isPronto && (
                 <button 
                   className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-lg shadow-green-100 transition-all flex justify-center items-center gap-2"
                   // Aqui futuramente colocaremos a função de finalizar
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                     <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                   </svg>
                   Finalizar Lote
                 </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}