"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Tenta o login
    const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
    })

    if (error) {
        alert("Erro ao entrar: " + error.message)
        return
    }

    if (data.session) {
        // 2. O segredo: dar um "refresh" para o middleware ler o novo cookie
        router.refresh() 
        
        // 3. Redirecionar
        setTimeout(() => {
        router.push('/')
        }, 100)
    }
    }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-yellow-600 text-center">Raffinato 🍋</h1>
        <div className="space-y-4">
          <input 
            type="email" placeholder="E-mail" 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <input 
            type="password" placeholder="Senha" 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button type="submit" className="w-full bg-yellow-500 text-white py-2 rounded font-bold hover:bg-yellow-600">
            Entrar no Sistema
          </button>
        </div>
      </form>
    </div>
  )
}