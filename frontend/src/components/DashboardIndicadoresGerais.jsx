import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, HeartPulse, AlertCircle, Printer, UserCheck, LayoutDashboard, PieChart as PieChartIcon } from 'lucide-react';
import html2canvas from 'html2canvas'; // Importação CORRETA
import jsPDF from 'jspdf'; // Importação CORRETA

const CORES = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DashboardUnificado() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abaInterna, setAbaInterna] = useState('geral'); // 'geral' ou 'avancado'
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState('');

  // Dados do último mês para os cards de resumo
  const ultimoDado = dados.length > 0 ? dados[dados.length - 1] : null;
  const nomeMesAtual = ultimoDado ? ultimoDado.mes : 'N/A';
  const admissoesMes = ultimoDado ? Number(ultimoDado.admissoes || 0) : 0;
  const altasMes = ultimoDado ? Number(ultimoDado.altas_clinicas || 0) : 0;
  const obitosMes = ultimoDado ? Number(ultimoDado.obitos || 0) : 0;

  // Cálculos para Aba Avançada
  const mediaFeridas = dados.length > 0 
    ? (dados.reduce((acc, curr) => acc + Number(curr.feridas_ativas || 0), 0) / dados.length).toFixed(1)
    : '0.0';

  const vmAtual = ultimoDado ? Number(ultimoDado.pacientes_vm || 0) : 0;
  const paliativosAtuais = ultimoDado ? Number(ultimoDado.cuidados_paliativos || 0) : 0;

  // Dados para o PieChart de Dispositivos
  const dadosMesSelecionado = dados.find(d => d.mes === mesSelecionado);
  const dadosPizza = dadosMesSelecionado ? [
    { name: 'VM', value: Number(dadosMesSelecionado.pacientes_vm || 0) },
    { name: 'TQT', value: Number(dadosMesSelecionado.pacientes_tqt || 0) },
    { name: 'GTT', value: Number(dadosMesSelecionado.pacientes_gtt || 0) },
    { name: 'SNE', value: Number(dadosMesSelecionado.pacientes_sne || 0) },
  ].filter(item => item.value > 0) : [];
  const mesEstaZerado = dadosPizza.length === 0;

  // 1. BUSCAR DADOS
  const buscarDados = async () => {
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/indicadores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resposta.ok) throw new Error("Acesso negado");

      const dadosBanco = await resposta.json();
      setDados(dadosBanco.sort((a, b) => {
        // Ordena por mês (assumindo que "mes" é uma string como "Janeiro", "Fevereiro")
        const mesesOrdem = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        return mesesOrdem.indexOf(a.mes) - mesesOrdem.indexOf(b.mes);
      }));

      // Define o último mês como padrão para o gráfico de pizza
      if (dadosBanco.length > 0) {
        setMesSelecionado(dadosBanco[dadosBanco.length - 1].mes);
      }
    } catch (erro) {
      console.error("Erro ao buscar dados:", erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  // 2. GERAR PDF (Usando html2canvas e jsPDF, como no seu original)
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

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-600">
        <svg className="animate-spin h-8 w-8 mr-3 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Carregando dados do dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen" id="conteudo-pdf"> {/* Padding responsivo */}
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"> {/* Layout responsivo */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Dashboard Unificado</h1> {/* Tamanho da fonte responsivo */}
            <p className="text-sm md:text-base text-slate-500">Visão geral e análise detalhada dos indicadores.</p> {/* Tamanho da fonte responsivo */}
          </div>
          <button
            onClick={gerarPDF}
            disabled={gerandoPdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md text-sm md:text-base" // Largura e padding responsivos
          >
            {gerandoPdf ? 'Gerando PDF...' : <><Printer size={18} /> Baixar PDF</>}
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 border-b border-slate-200 pb-2"> {/* Layout responsivo */}
          <button
            onClick={() => setAbaInterna('geral')}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium transition-colors text-sm md:text-base ${ // Largura e padding responsivos
              abaInterna === 'geral'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard size={18} className="inline-block mr-2" /> Indicadores Gerais
          </button>
          <button
            onClick={() => setAbaInterna('avancado')}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium transition-colors text-sm md:text-base ${ // Largura e padding responsivos
              abaInterna === 'avancado'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PieChartIcon size={18} className="inline-block mr-2" /> Análise Avançada
          </button>
        </div>

        {/* Conteúdo da Aba Geral */}
        {abaInterna === 'geral' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-5">Resumo do {nomeMesAtual}</h2> {/* Tamanho da fonte responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"> {/* Grid responsivo */}
              {/* Card Pacientes Ativos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4"> {/* Padding responsivo */}
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 shrink-0">
                  <Users size={20} className="md:w-6 md:h-6" /> {/* Tamanho do ícone responsivo */}
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Pacientes Ativos</p> {/* Tamanho da fonte responsivo */}
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{ultimoDado ? ultimoDado.pacientes_ativos : 'N/A'}</p> {/* Tamanho da fonte responsivo */}
                </div>
              </div>
              {/* Card Admissões */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
                  <UserCheck size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Admissões ({nomeMesAtual})</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{admissoesMes}</p>
                </div>
              </div>
              {/* Card Altas Clínicas */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 shrink-0">
                  <HeartPulse size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Altas Clínicas ({nomeMesAtual})</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{altasMes}</p>
                </div>
              </div>
              {/* Card Óbitos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
                  <AlertCircle size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Óbitos ({nomeMesAtual})</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{obitosMes}</p>
                </div>
              </div>
            </div>

            {/* Gráficos da Aba Geral */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"> {/* Grid responsivo */}
              {/* Gráfico de Pacientes Ativos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200"> {/* Padding responsivo */}
                <h3 className="text-base md:text-lg font-bold text-blue-800 mb-4 text-center">📊 Pacientes Ativos por Mês</h3> {/* Tamanho da fonte responsivo */}
                <div className="h-64 md:h-72 w-full"> {/* Altura responsiva */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} /> {/* Tamanho da fonte do tick */}
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} /> {/* Tamanho da fonte do tick */}
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} /> {/* Tamanho da fonte da legenda */}
                      <Line type="monotone" dataKey="pacientes_ativos" name="Pacientes Ativos" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} /> {/* Largura da linha e tamanho do dot */}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Admissões e Altas */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-bold text-green-800 mb-4 text-center">📈 Admissões e Altas Clínicas</h3>
                <div className="h-64 md:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="admissoes" name="Admissões" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="altas_clinicas" name="Altas Clínicas" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba Avançada */}
        {abaInterna === 'avancado' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-5">Análise Detalhada</h2> {/* Tamanho da fonte responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8"> {/* Grid responsivo */}
              {/* Card Média de Feridas Ativas */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-full text-orange-600 shrink-0">
                  <AlertCircle size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Média Feridas Ativas</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{mediaFeridas}</p>
                </div>
              </div>
              {/* Card Pacientes em VM */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-cyan-100 p-3 rounded-full text-cyan-600 shrink-0">
                  <HeartPulse size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Pacientes em VM ({nomeMesAtual})</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{vmAtual}</p>
                </div>
              </div>
              {/* Card Cuidados Paliativos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 shrink-0">
                  <HeartPulse size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">C. Paliativos ({nomeMesAtual})</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{paliativosAtuais}</p>
                </div>
              </div>
            </div>

            {/* Gráficos da Aba Avançada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"> {/* Grid responsivo */}
              {/* Gráfico de Pizza de Uso de Dispositivos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-bold text-indigo-800 mb-4 text-center">⚙️ Uso de Dispositivos ({mesSelecionado})</h3>
                <div className="mb-4 flex justify-center">
                  <select
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                    className="w-full sm:w-auto p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm md:text-base" // Largura e padding responsivos
                  >
                    {dados.map((d) => (
                      <option key={d.mes} value={d.mes}>
                        {d.mes}
                      </option>
                    ))}
                  </select>
                </div>
                {mesEstaZerado ? (
                  <div className="h-64 md:h-80 flex items-center justify-center text-slate-500 text-sm md:text-base">
                    Nenhum dado de dispositivo para este mês.
                  </div>
                ) : (
                  <div className="h-64 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosPizza}
                          cx="50%"
                          cy="50%"
                          innerRadius={40} // Raio interno responsivo
                          outerRadius={80} // Raio externo responsivo
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          animationDuration={500}
                        >
                          {dadosPizza.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} verticalAlign="bottom" height={36} /> {/* Tamanho da fonte da legenda */}
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Gráfico de Cuidados Paliativos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-bold text-purple-800 mb-4 text-center">💜 Cuidados Paliativos</h3>
                <div className="h-64 md:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dados}>
                      <defs>
                        <linearGradient id="corPaliativo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="cuidados_paliativos" name="Cuidados Paliativos" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#corPaliativo)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Uso de Antibióticos (ATB) */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-bold text-red-800 mb-4 text-center">💊 Uso de Antibióticos (ATB)</h3>
                <div className="h-64 md:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
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