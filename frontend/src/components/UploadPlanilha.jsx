import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPlanilha() {
  const [arquivo, setArquivo] = useState(null);
  const [status, setStatus] = useState('ocioso'); // ocioso, carregando, sucesso, erro
  const [mensagem, setMensagem] = useState('');

  const handleUpload = async () => {
    if (!arquivo) return;

    setStatus('carregando');
    const formData = new FormData();
    formData.append('file', arquivo);

    try {
      // 1. Pega a "pulseira VIP" (token)
      const token = localStorage.getItem('token_melhor_em_casa');

      // 2. Faz o fetch enviando o arquivo E o token de segurança
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/planilha`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // ATENÇÃO: Quando enviamos arquivos (FormData), NUNCA colocamos o 'Content-Type'. 
          // O próprio navegador faz isso automaticamente.
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('sucesso');
        setMensagem(data.mensagem);
      } else {
        setStatus('erro');
        setMensagem(data.detail || 'Erro ao processar planilha.');
      }
    } catch (error) {
      setStatus('erro');
      setMensagem('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200">

      {/* Cabeçalho */}
      <div className="text-center mb-6 md:mb-8">
        <div className="bg-blue-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
          <UploadCloud className="text-blue-600 w-6 h-6 md:w-8 md:h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Importar Dados</h2>
        <p className="text-sm md:text-base text-slate-500 mt-2">Selecione a planilha Excel (.xlsx) com os indicadores mensais.</p>
      </div>

      {/* Área de Input de Arquivo */}
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 md:p-8 text-center hover:bg-slate-50 transition-colors overflow-hidden">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={(e) => setArquivo(e.target.files[0])}
          className="block w-full text-xs md:text-sm text-slate-500 
                     file:mr-2 md:file:mr-4 
                     file:py-2 file:px-4 
                     file:rounded-full file:border-0 
                     file:text-xs md:file:text-sm file:font-semibold 
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 
                     cursor-pointer"
        />
      </div>

      {/* Botão de Envio */}
      <button 
        onClick={handleUpload}
        disabled={!arquivo || status === 'carregando'}
        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors text-sm md:text-base"
      >
        {status === 'carregando' ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Importação'}
      </button>

      {/* Mensagens de Feedback */}
      {status === 'sucesso' && (
        <div className="mt-6 p-3 md:p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 border border-green-200 text-sm md:text-base">
          <CheckCircle size={20} className="shrink-0" /> <p className="font-medium">{mensagem}</p>
        </div>
      )}

      {status === 'erro' && (
        <div className="mt-6 p-3 md:p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-200 text-sm md:text-base">
          <AlertCircle size={20} className="shrink-0" /> <p className="font-medium">{mensagem}</p>
        </div>
      )}

    </div>
  );
}