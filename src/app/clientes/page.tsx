import { createClient } from '@/lib/supabaseServer'

export const revalidate = 0

export default async function ClientesPage() {
  const supabase = await createClient()

  // Busca clientes e soma suas compras
  const { data: clientes } = await supabase
    .from('Cliente')
    .select(`
      *,
      vendas ( valor_total, data_venda )
    `)
    .order('nome', { ascending: true })

  // Processamento de dados para o visual
  const listaClientes = clientes?.map((c: any) => {
    const totalGasto = c.vendas.reduce((acc: number, v: any) => acc + v.valor_total, 0)
    const ultimaCompra = c.vendas.length > 0 
      ? new Date(Math.max(...c.vendas.map((v: any) => new Date(v.data_venda).getTime())))
      : null
    
    return { ...c, totalGasto, ultimaCompra }
  })

  // Cores das Tags
  const getBadgeColor = (tipo: string) => {
    switch(tipo?.toLowerCase()) {
      case 'emporio': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'restaurante': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto mt-12 md:mt-0">
      
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Carteira de Clientes 👥</h1>
        <p className="text-gray-500 font-medium">Gestão de contatos e histórico</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listaClientes?.map((cliente) => (
          <div key={cliente.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xl uppercase">
                {cliente.nome.charAt(0)}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getBadgeColor(cliente.tipo)}`}>
                {cliente.tipo || 'Consumidor'}
              </span>
            </div>

            <h2 className="text-xl font-black text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors">
              {cliente.nome}
            </h2>
            <p className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {cliente.telefone}
            </p>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase">Total Comprado</span>
                <span className="block text-lg font-black text-green-600">
                  R$ {cliente.totalGasto.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-gray-400 uppercase">Última Compra</span>
                <span className="block text-sm font-bold text-gray-700">
                  {cliente.ultimaCompra ? cliente.ultimaCompra.toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}