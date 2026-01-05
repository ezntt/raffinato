import { createClient } from '@supabase/supabase-js'

export default async function LotesPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: lotes } = await supabase.from('lotes').select('*')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Lotes em Produção</h1>
      <div className="space-y-4">
        {lotes?.map(l => (
          <div key={l.id} className="bg-white p-4 border-l-4 border-yellow-500 shadow-sm flex justify-between">
            <div>
              <p className="font-bold">{l.descricao}</p>
              <p className="text-sm">Início: {new Date(l.data_inicio).toLocaleDateString()}</p>
            </div>
            <span className="bg-yellow-100 px-3 py-1 rounded text-sm font-bold uppercase">{l.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}