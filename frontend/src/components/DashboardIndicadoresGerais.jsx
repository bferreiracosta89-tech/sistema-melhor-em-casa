import React, { useState, useEffect } from 'react';
// IMPORTAÇÕES CORRIGIDAS (Adicionado AreaChart, PieChart, Cell, etc)
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, HeartPulse, AlertCircle, Printer, UserCheck, LayoutDashboard, PieChart as PieChartIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function DashboardUnificado() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Controles de Tela
  const [abaInterna, setAbaInterna] = useState('geral');
  const [mesSelecionado, setMesSelecionado] = useState(''); // Para o gráfico de pizza

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const token = localStorage.getItem('token_melhor_em_casa');
        const resposta = await fetch('https://api-melhor-em-casa.onrender.com/api/indicadores', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
          const dadosBanco = await resposta.json();
          setDados(dadosBanco);
          // Define o último mês como padrão para o gráfico de pizza
          if (dadosBanco.length > 0) {
            setMesSelecionado(dadosBanco[dadosBanco.length - 1].mes);
          }
        }
      } catch (erro) {
        console.error("Erro ao buscar dados:", erro);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  const gerarPDF = async () => {
    setGerandoPdf(true);
    const elemento = document.getElementById('conteudo-pdf');

    try {
      const canvas = await html2canvas(elemento, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff' 
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); 
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text(abaInterna === 'geral' ? "Relatório de Indicadores Gerais" : "Relatório de Análise Avançada", 14, 15);
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save(`Dashboard_${abaInterna}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // ==========================================
  // MATEMÁTICA E VARIÁVEIS (Geral e Avançado)
  // ==========================================
  const ultimoDado = dados.length > 0 ? dados[dados.length - 1] : null;
  const nomeMesAtual = ultimoDado ? ultimoDado.mes : 'Mês Atual';

  // Variáveis do Geral
  const admissoesMes = ultimoDado ? Number(ultimoDado.admissoes || 0) : 0;
  const altasMes = ultimoDado ? Number(ultimoDado.altas_clinicas || 0) : 0;
  const obitosMes = ultimoDado ? Number(ultimoDado.obitos || 0) : 0;

  // Variáveis do Avançado
  const totalFeridas = dados.reduce((acc, curr) => acc + Number(curr.feridas_ativas || 0), 0);
  const mediaFeridas = dados.length > 0 ? Math.round(totalFeridas / dados.length) : 0;
    // 1. Consertando o card de Respiradores
  const vmAtual = ultimoDado ? Number(ultimoDado.pacientes_vm || 0) : 0;
  const paliativosAtuais = ultimoDado ? Number(ultimoDado.cuidados_paliativos || 0) : 0;

    // --- SUBSTITUA ESTE BLOCO NO SEU REACT ---

  const dadosMesSelecionado = dados.find(d => d.mes === mesSelecionado) || ultimoDado;

  // 1. Adicionamos GTT e SNE na lista do gráfico
  const dadosPizza = dadosMesSelecionado ? [
    { name: 'Ventilação Mecânica', value: Number(dadosMesSelecionado.pacientes_vm || 0) },
    { name: 'Traqueostomia', value: Number(dadosMesSelecionado.pacientes_tqt || 0) },
    { name: 'Gastrostomia (GTT)', value: Number(dadosMesSelecionado.pacientes_gtt || 0) },
    { name: 'Sonda Nasoenteral (SNE)', value: Number(dadosMesSelecionado.pacientes_sne || 0) }
  ] : [];

  const mesEstaZerado = dadosPizza.every(item => item.value === 0);

  // 2. Adicionamos mais duas cores (Roxo e Laranja) para as novas fatias
  const CORES = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b']; 

  if (carregando) {
    return <div className="p-6 text-center text-slate-500 font-semibold">Carregando dashboard...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* CABEÇALHO PRINCIPAL */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard Unificado</h2>
        <button 
          onClick={gerarPDF}
          disabled={gerandoPdf}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors shadow-sm ${
            gerandoPdf ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Printer size={20} />
          {gerandoPdf ? 'Gerando PDF...' : 'Exportar para PDF'}
        </button>
      </div>

      {/* BOTÕES DE ABAS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setAbaInterna('geral')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            abaInterna === 'geral' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard size={20} /> Indicadores Gerais
        </button>

        <button
          onClick={() => setAbaInterna('avancado')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            abaInterna === 'avancado' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <PieChartIcon size={20} /> Análise Avançada
        </button>
      </div>

      {/* ÁREA QUE SERÁ EXPORTADA PARA PDF */}
      <div id="conteudo-pdf" className="bg-slate-50/50 p-2 rounded-xl">

        {abaInterna === 'geral' ? (
          /* ================= ABA GERAL ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-lg text-purple-600"><UserCheck size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500">Ativos em {nomeMesAtual}</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {ultimoDado ? Number(ultimoDado.pacientes_ativos || 0) : 0}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-blue-600"><Users size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500">Admissões em {nomeMesAtual}</p>
                  <p className="text-2xl font-bold text-slate-800">{admissoesMes}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-lg text-green-600"><HeartPulse size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500">Altas em {nomeMesAtual}</p>
                  <p className="text-2xl font-bold text-slate-800">{altasMes}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-red-100 p-4 rounded-lg text-red-600"><AlertCircle size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500">Óbitos em {nomeMesAtual}</p>
                  <p className="text-2xl font-bold text-slate-800">{obitosMes}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Admissões, Altas e Óbitos</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="admissoes" name="Admissões" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="altas_clinicas" name="Altas Clínicas" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="obitos" name="Óbitos" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Complexidade (AD1, AD2, AD3)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Bar dataKey="ad1" name="AD1" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ad2" name="AD2" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ad3" name="AD3" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= ABA AVANÇADA ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                <p className="text-sm text-slate-500 font-semibold uppercase">Média de Feridas (Ano)</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">🩹 {mediaFeridas}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-sm text-slate-500 font-semibold uppercase">Respiradores em {nomeMesAtual}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">🫁 {vmAtual}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <p className="text-sm text-slate-500 font-semibold uppercase">Paliativos em {nomeMesAtual}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">💜 {paliativosAtuais}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Evolução de Feridas Ativas</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="feridas_ativas" name="Feridas Ativas" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b pb-2 w-full">
                  <h3 className="text-lg font-bold text-slate-800">Uso de Dispositivos</h3>
                  <select 
                    className="p-2 border border-slate-300 rounded-md bg-slate-50 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                  >
                    {dados.map((d, index) => (
                      <option key={index} value={d.mes}>{d.mes}</option>
                    ))}
                  </select>
                </div>
                {mesEstaZerado ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 font-medium text-center px-4">
                    Nenhum paciente em VM ou TQT registrado.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosPizza} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                          {dadosPizza.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-purple-800 mb-6 text-center">💜 Cuidados Paliativos</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dados}>
                      <defs>
                        <linearGradient id="corPaliativo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Area type="monotone" dataKey="cuidados_paliativos" name="Cuidados Paliativos" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#corPaliativo)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-red-800 mb-6 text-center">💊 Uso de Antibióticos (ATB)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Bar dataKey="uso_atb" name="Pacientes com ATB" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}