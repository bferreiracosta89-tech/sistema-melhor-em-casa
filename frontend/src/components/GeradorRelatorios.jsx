import React, { useState } from 'react';
import { Sparkles, Activity, Briefcase, Download, Send, MessageCircle, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

export default function GeradorRelatorios() {
  const [relatorioIA, setRelatorioIA] = useState("");
  const [gerando, setGerando] = useState(false);

  // Estados para o Chat
  const [historicoChat, setHistoricoChat] = useState([]);
  const [mensagemAtual, setMensagemAtual] = useState("");
  const [enviandoChat, setEnviandoChat] = useState(false);

  // 1. GERAR RELATÓRIO (Agora com Token)
  const pedirParaIAGerar = async (tipoRelatorio) => {
    setGerando(true);
    setRelatorioIA(""); 
    setHistoricoChat([]); 

    try {
      const token = localStorage.getItem('token_melhor_em_casa'); // Pega o token

      const resposta = await fetch(`https://api-melhor-em-casa.onrender.com/api/relatorios/gerar?tipo=${tipoRelatorio}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Envia a autorização
        }
      });

      if (!resposta.ok) throw new Error("Erro no servidor ou acesso negado");
      const dados = await resposta.json();
      setRelatorioIA(dados.relatorio_markdown);
    } catch (erro) {
      setRelatorioIA("⚠️ Erro ao gerar relatório. Verifique sua conexão ou faça login novamente.");
    } finally {
      setGerando(false);
    }
  };

  const exportarPDF = () => {
    const elemento = document.getElementById('relatorio-pdf');
    const opcoes = {
      margin: 15,
      filename: 'Relatorio_MelhorEmCasa.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opcoes).from(elemento).save();
  };

  // 2. CHAT COM A IA (Agora com Token)
  const enviarMensagemChat = async (e) => {
    e.preventDefault();
    if (!mensagemAtual.trim()) return;

    const novaMensagem = { role: 'user', text: mensagemAtual };
    setHistoricoChat(prev => [...prev, novaMensagem]);
    setMensagemAtual("");
    setEnviandoChat(true);

    try {
      const token = localStorage.getItem('token_melhor_em_casa'); // Pega o token

      const resposta = await fetch('https://api-melhor-em-casa.onrender.com/api/relatorios/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Envia a autorização
        },
        body: JSON.stringify({
          mensagem: novaMensagem.text,
          contexto_relatorio: relatorioIA 
        })
      });

      if (!resposta.ok) throw new Error("Erro na API ou acesso negado");
      const dados = await resposta.json();

      setHistoricoChat(prev => [...prev, { role: 'ai', text: dados.resposta }]);

      if (dados.novo_relatorio && dados.novo_relatorio !== relatorioIA) {
        setRelatorioIA(dados.novo_relatorio);
      }

    } catch (erro) {
      setHistoricoChat(prev => [...prev, { role: 'ai', text: "⚠️ Desculpe, ocorreu um erro ao processar sua pergunta." }]);
    } finally {
      setEnviandoChat(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* CAIXA DO RELATÓRIO */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="border-b pb-6 mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-full text-purple-700">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Auditoria com IA</h2>
                  <p className="text-gray-500 text-sm">Escolha o foco da análise</p>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button onClick={() => pedirParaIAGerar('clinico')} disabled={gerando} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50">
                  <Activity size={18} /> Análise Clínica
                </button>
                <button onClick={() => pedirParaIAGerar('gerencial')} disabled={gerando} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                  <Briefcase size={18} /> Análise Gerencial
                </button>
              </div>
            </div>

            {relatorioIA && !gerando && (
              <button onClick={exportarPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-purple-700 bg-purple-100 hover:bg-purple-200">
                <Download size={20} /> Baixar PDF
              </button>
            )}
          </div>

          <div id="relatorio-pdf" className="min-h-[200px] text-gray-800">
            <div className="hidden print:block mb-8 border-b pb-4">
              <h1 className="text-2xl font-bold text-center text-blue-800">Programa Melhor em Casa</h1>
            </div>

            {gerando ? (
              <div className="flex flex-col items-center justify-center text-purple-600 animate-pulse mt-10">
                <Sparkles size={40} className="mb-4" />
                <p className="font-semibold">Analisando dados...</p>
              </div>
            ) : relatorioIA ? (
              <div className="prose prose-purple max-w-none">
                <ReactMarkdown>{relatorioIA}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-center text-gray-400 italic mt-10">Selecione um botão para gerar o relatório.</p>
            )}
          </div>
        </div>

        {/* CAIXA DO CHAT */}
        {relatorioIA && !gerando && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 text-white p-4 flex items-center gap-2">
              <MessageCircle size={20} />
              <h3 className="font-bold">Converse com o Relatório</h3>
            </div>

            <div className="p-4 h-64 overflow-y-auto bg-gray-50 space-y-4">
              {historicoChat.length === 0 ? (
                <p className="text-center text-gray-400 italic mt-10">Faça uma pergunta sobre os dados acima...</p>
              ) : (
                historicoChat.map((msg, index) => (
                  <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-2 rounded-full h-10 w-10 flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                    </div>
                    <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                      {msg.role === 'user' ? msg.text : <div className="prose prose-sm"><ReactMarkdown>{msg.text}</ReactMarkdown></div>}
                    </div>
                  </div>
                ))
              )}
              {enviandoChat && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-full h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600">
                    <Sparkles size={20} className="animate-spin" />
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-gray-200 text-gray-500 italic">
                    Digitando...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={enviarMensagemChat} className="p-4 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={mensagemAtual}
                onChange={(e) => setMensagemAtual(e.target.value)}
                placeholder="Ex: Qual foi o total de altas?"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={enviandoChat}
              />
              <button 
                type="submit" 
                disabled={enviandoChat || !mensagemAtual.trim()}
                className="bg-purple-600 text-white p-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} /> Enviar
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}