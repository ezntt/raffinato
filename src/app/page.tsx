"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export default function Home() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProdutos() {
      const { data, error } = await supabase.from('produtos').select('*');
      if (!error) setProdutos(data);
      setLoading(false);
    }
    getProdutos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-yellow-600">RAFFINATO 🍋</h1>
          <p className="text-gray-600">Controle de Produção e Estoque</p>
        </div>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition">
          + Novo Pedido
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Resumo de Estoque */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">Estoque Disponível</h2>
          {loading ? <p>Carregando...</p> : (
            <div className="mt-4 space-y-2">
              {produtos.map(p => (
                <div key={p.id} className="flex justify-between border-b pb-1">
                  <span>{p.nome}</span>
                  <span className="font-bold">{p.quantidade_estoque} un</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card de Lotes (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">Lotes em Infusão</h2>
          <p className="mt-4 text-gray-400 italic">Nenhum lote ativo no momento.</p>
        </div>
      </div>
    </div>
  );
}