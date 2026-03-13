import React, { useState, useEffect } from 'react';

export default function InfoUsuario() {
  const [nomeUsuario, setNomeUsuario] = useState('Carregando...');
  const [tempoConexao, setTempoConexao] = useState(0);

  useEffect(() => {
    // 1. Pega o token salvo no navegador
    const token = localStorage.getItem('token_melhor_em_casa');

    if (token) {
      try {
        // 2. Abre o token e lê os dados que o Python guardou lá dentro
        const payload = JSON.parse(atob(token.split('.')[1]));

        // 3. Salva o nome na tela (se não tiver nome, usa o começo do email)
        if (payload.nome) {
          setNomeUsuario(payload.nome);
        } else if (payload.sub) {
          setNomeUsuario(payload.sub.split('@')[0]); 
        }
      } catch (e) {
        console.error("Erro ao ler o token de segurança");
        setNomeUsuario('Usuário');
      }
    }

    // Inicia o cronômetro
    const intervalo = setInterval(() => {
      setTempoConexao((tempoAnterior) => tempoAnterior + 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex items-center justify-between bg-white p-2 md:p-4 shadow-sm border border-gray-100 rounded-lg">
      <div className="flex items-center gap-2 md:gap-3">

        {/* Círculo com a inicial do nome (Menor no celular, maior no PC) */}
        <div className="bg-blue-600 text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-sm md:text-lg shadow-inner shrink-0">
          {nomeUsuario.charAt(0).toUpperCase()}
        </div>

        {/* Nome do usuário com proteção contra textos muito longos */}
        <div>
          <p className="font-bold text-gray-800 text-sm md:text-base truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
            {nomeUsuario}
          </p>
        </div>

      </div>
    </div>
  );
}