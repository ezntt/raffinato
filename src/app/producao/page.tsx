"use client"
import { useState } from 'react'
import { CalculadoraLicor } from '@/components/CalculadoraLicor'
import { CalculadoraXarope } from '@/components/CalculadoraXarope'

export default function ProducaoPage() {
  const [activeTab, setActiveTab] = useState<'licor' | 'xarope'>('licor')

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Nova Produção</h1>
        
        <div className="flex gap-2 mt-6 p-1 bg-gray-100 rounded-xl w-fit">
            <button 
                onClick={() => setActiveTab('licor')}
                className={`px-6 py-2  rounded-lg font-bold text-sm transition-all ${activeTab === 'licor' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Licor (Lote)
            </button>
            <button 
                onClick={() => setActiveTab('xarope')}
                className={`px-6 py-2  rounded-lg font-bold text-sm transition-all ${activeTab === 'xarope' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Xarope (Garrafas)
            </button>
        </div>
      </header>

      {activeTab === 'licor' ? <CalculadoraLicor /> : <CalculadoraXarope />}
    </div>
  )
}