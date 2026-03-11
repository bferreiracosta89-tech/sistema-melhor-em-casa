import React, { useState } from 'react';

export default function Login({ onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const fazerLogin = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const resposta = await fetch('https://api-melhor-em-casa.onrender.com/api/usuarios/login', {
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">Melhor em Casa</h2>

        {erro && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{erro}</div>}

        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input 
              type="email" 
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" 
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold transition-colors"
          >
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
}