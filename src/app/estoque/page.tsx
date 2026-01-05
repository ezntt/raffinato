import { createClient } from '@supabase/supabase-js'

export default async function EstoquePage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: produtos } = await supabase.from('Produto').select('*')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Estoque Raffinato 🍋</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {produtos?.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between">
            <span className="font-medium">{p.nome}</span>
            <span className="font-bold">{p.qtd_estoque} un</span>
          </div>
        ))}
      </div>
    </div>
  )
}