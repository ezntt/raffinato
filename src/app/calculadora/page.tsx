"use client"
import { useState } from 'react'

export default function CalculadoraRaffinato() {
  const [qtdGarrafas, setQtdGarrafas] = useState(1)
  const [tipo, setTipo] = useState<'limoncello' | 'arancello'>('limoncello')

  // Proporções exatas baseadas no vidro de 5L (4800ml totais)
  const volGarrafa = 750
  const pctAlcool = 1400 / 4800
  const pctXarope = 3400 / 4800

  // Cálculo de Xarope e Álcool
  const totalAlcool = (volGarrafa * pctAlcool) * qtdGarrafas
  const totalXarope = (volGarrafa * pctXarope) * qtdGarrafas

  // Decomposição do Xarope (1kg açúcar + água = 2900ml xarope)
  const acucarPorMlXarope = 1000 / 2900
  const totalAcucar = totalXarope * acucarPorMlXarope
  
  // Água baseada na sua receita (2250ml para Limon, 2500ml para Aran por kg de açúcar)
  const ratioAgua = tipo === 'limoncello' ? 2.25 : 2.5
  const totalAgua = totalAcucar * ratioAgua

  return (
    <div className="p-8 max-w-3xl mx-auto text-black font-sans">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-yellow-600">Calculadora de Produção Raffinato 🍋</h1>
        <p className="text-gray-500">Proporções artesanais convertidas para precisão industrial.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Inputs */}
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <label className="block text-sm font-bold mb-4 uppercase text-gray-400">Configuração do Lote</label>
            
            <div className="mb-4">
              <span className="block text-sm mb-1">Produto:</span>
              <div className="flex gap-2">
                {['limoncello', 'arancello'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t as any)}
                    className={`flex-1 py-2 rounded-lg border-2 capitalize font-bold transition ${
                      tipo === t ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm mb-1">Quantidade de Garrafas (750ml):</span>
              <input 
                type="number" 
                value={qtdGarrafas} 
                onChange={(e) => setQtdGarrafas(Math.max(1, Number(e.target.value)))}
                className="w-full p-3 bg-gray-50 border rounded-lg text-2xl font-bold focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Lado Direito: Resultados */}
        <section className="bg-gray-900 text-white p-6 rounded-xl shadow-inner">
          <h2 className="text-sm font-bold mb-6 uppercase text-gray-400">Insumos Necessários</h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs text-yellow-500 font-bold uppercase mb-1">Fase 1: Infusão</p>
              <div className="flex justify-between items-end border-b border-gray-700 pb-2">
                <span className="text-gray-300">Álcool com Óleo</span>
                <span className="text-2xl font-mono">{totalAlcool.toFixed(0)}ml</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-blue-400 font-bold uppercase mb-1">Fase 2: Xarope (Mistura)</p>
              <div className="space-y-2">
                <div className="flex justify-between items-end border-b border-gray-700 pb-2">
                  <span className="text-gray-300">Água Filtrada</span>
                  <span className="text-2xl font-mono">{totalAgua.toFixed(0)}ml</span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-700 pb-2">
                  <span className="text-gray-300">Açúcar</span>
                  <span className="text-2xl font-mono">{totalAcucar.toFixed(0)}g</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Volume de Xarope Final:</span>
                <span className="text-white font-bold">{totalXarope.toFixed(0)}ml</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-400">Rendimento Total:</span>
                <span className="text-white font-bold">{(volGarrafa * qtdGarrafas)}ml</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}