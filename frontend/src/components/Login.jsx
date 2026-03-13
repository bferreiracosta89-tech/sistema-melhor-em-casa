import React, { useState } from 'react';

export default function Login({ onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true); 
    try {
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        // Salva o nome do usuário no navegador
        localStorage.setItem('token_melhor_em_casa', dados.access_token);

        // Avisa o sistema que logou com sucesso para mostrar o Dashboard
        onLoginSucesso();
      } else {
        setErro(dados.detail || 'Erro ao fazer login');
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false); 
    }
  };

  return (
    // Adicionado px-4 para dar respiro nas laterais do celular
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      {/* Trocado w-96 por w-full max-w-sm */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">Melhor em Casa</h2>

        {erro && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">{erro}</div>}

        <form onSubmit={fazerLogin} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
         <button 
            type="submit" 
            disabled={carregando}
            className={`w-full text-white p-3 rounded-lg font-bold transition-colors shadow-sm ${
              carregando ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {carregando ? 'Acordando servidor...' : 'Entrar no Sistema'}
        </button>
        </form>
      </div>
    </div>
  );
}