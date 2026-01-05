import { createClient } from '@supabase/supabase-js'

export default async function ClientesPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: clientes } = await supabase.from('clientes').select('*')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Clientes Raffinato</h1>
      <table className="w-full bg-white rounded-lg shadow text-left">
        <thead>
          <tr className="border-b">
            <th className="p-4">Nome</th>
            <th className="p-4">WhatsApp</th>
            <th className="p-4">Total Compras</th>
          </tr>
        </thead>
        <tbody>
          {clientes?.map(c => (
            <tr key={c.id} className="border-b">
              <td className="p-4">{c.nome}</td>
              <td className="p-4">{c.whatsapp}</td>
              <td className="p-4">{c.total_compras || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}