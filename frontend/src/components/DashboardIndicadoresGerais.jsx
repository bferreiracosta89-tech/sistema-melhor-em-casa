import React, { useState, useEffect } from 'react';
// IMPORTAÇÕES CORRIGIDAS (Adicionado AreaChart, PieChart, Cell, etc)
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, HeartPulse, AlertCircle, Printer, UserCheck, LayoutDashboard, PieChart as PieChartIcon } from 'lucide-react';
import html2pdf from 'html22pdf.js'; // Usando html2pdf.js para exportação

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

  // 2. GERAR PDF
  const gerarPDF = async () => {
    setGerandoPdf(true);
    const elemento = document.getElementById('conteudo-pdf');

    try {
      const opcoes = {
        margin: [10, 10, 10, 10], // Top, Left, Bottom, Right
        filename: `Dashboard_${abaInterna}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Adiciona um título antes de gerar o PDF
      const titulo = abaInterna === 'geral' ? "Relatório de Indicadores Gerais" : "Relatório de Análise Avançada";
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `<h1 style="font-size: 24px; font-weight: bold; margin-bottom: 15px; text-align: center;">${titulo}</h1>`;
      tempDiv.appendChild(elemento.cloneNode(true)); // Clona o conteúdo para não alterar o DOM original

      await html2pdf().set(opcoes).from(tempDiv).save();

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setGerandoPdf(false);
    }
  };

  if (carregando) {
    return <div className="p-4 md:p-6 text-center text-slate-500 font-semibold">Carregando dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto"> {/* Padding ajustado */}

      {/* CABEÇALHO PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4"> {/* Layout responsivo */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Dashboard Unificado</h2> {/* Tamanho da fonte responsivo */}
        <button 
          onClick={gerarPDF}
          disabled={gerandoPdf}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors shadow-sm text-sm md:text-base ${ // Largura e tamanho da fonte responsivos
            gerandoPdf ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Printer size={20} />
          {gerandoPdf ? 'Gerando PDF...' : 'Exportar para PDF'}
        </button>
      </div>

      {/* BOTÕES DE ABAS */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"> {/* Layout responsivo */}
        <button
          onClick={() => setAbaInterna('geral')}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors text-sm md:text-base ${ // Largura e tamanho da fonte responsivos
            abaInterna === 'geral' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LayoutDashboard size={20} /> Indicadores Gerais
        </button>
        <button
          onClick={() => setAbaInterna('avancado')}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors text-sm md:text-base ${ // Largura e tamanho da fonte responsivos
            abaInterna === 'avancado' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChartIcon size={20} /> Análise Avançada
        </button>
      </div>

      {/* CONTEÚDO DINÂMICO DAS ABAS */}
      <div id="conteudo-pdf"> {/* ID para o PDF */}
        {abaInterna === 'geral' && (
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Resumo do {nomeMesAtual}</h3> {/* Tamanho da fonte responsivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"> {/* Grid responsivo */}

              {/* Card 1: Pacientes Ativos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center"> {/* Padding ajustado */}
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-3">
                  <Users size={20} className="md:w-6 md:h-6" /> {/* Tamanho do ícone responsivo */}
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Pacientes Ativos</p> {/* Tamanho da fonte responsivo */}
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{ultimoDado ? ultimoDado.pacientes_ativos : 'N/A'}</p> {/* Tamanho da fonte responsivo */}
              </div>

              {/* Card 2: Admissões */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="bg-green-100 text-green-600 p-3 rounded-full mb-3">
                  <UserCheck size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Admissões ({nomeMesAtual})</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{admissoesMes}</p>
              </div>

              {/* Card 3: Altas Clínicas */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full mb-3">
                  <HeartPulse size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Altas Clínicas ({nomeMesAtual})</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{altasMes}</p>
              </div>

              {/* Card 4: Óbitos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="bg-red-100 text-red-600 p-3 rounded-full mb-3">
                  <AlertCircle size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Óbitos ({nomeMesAtual})</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{obitosMes}</p>
              </div>
            </div>

            {/* GRÁFICOS GERAIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6"> {/* Grid responsivo */}

              {/* Gráfico de Admissões e Altas */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200"> {/* Padding ajustado */}
                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 text-center">Admissões vs. Altas</h3> {/* Tamanho da fonte responsivo */}
                <div className="h-64 md:h-80 w-full"> {/* Altura responsiva */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} /> {/* Tamanho da fonte do tick */}
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} /> {/* Tamanho da fonte do tick */}
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} /> {/* Tamanho da fonte da legenda */}
                      <Line type="monotone" dataKey="admissoes" name="Admissões" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} /> {/* Largura da linha e tamanho do dot */}
                      <Line type="monotone" dataKey="altas_clinicas" name="Altas Clínicas" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Pacientes Ativos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 text-center">Pacientes Ativos</h3>
                <div className="h-64 md:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dados}>
                      <defs>
                        <linearGradient id="corAtivos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="pacientes_ativos" name="Pacientes Ativos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#corAtivos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {abaInterna === 'avancado' && (
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Análise Avançada</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"> {/* Grid responsivo */}

              {/* Card 1: Média de Feridas Ativas */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="bg-red-100 text-red-600 p-3 rounded-full mb-3">
                  <AlertCircle size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Média Feridas Ativas</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{mediaFeridas}</p>
              </div>

              {/* Card 2: Pacientes em VM */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full mb-3">
                  <HeartPulse size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Pacientes em VM ({nomeMesAtual})</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{vmAtual}</p>
              </div>

              {/* Card 3: Pacientes em Paliativos */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full mb-3">
                  <Users size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Paliativos ({nomeMesAtual})</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{paliativosAtuais}</p>
              </div>
            </div>

            {/* GRÁFICOS AVANÇADOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6"> {/* Grid responsivo */}

              {/* Gráfico de Feridas Ativas */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-bold text-red-800 mb-4 text-center">Feridas Ativas</h3>
                <div className="h-64 md:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="feridas_ativas" name="Feridas Ativas" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Uso de Dispositivos (Pizza) */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b pb-2 w-full gap-2"> {/* Layout responsivo para o cabeçalho do gráfico */}
                  <h3 className="text-base md:text-lg font-bold text-slate-800">Uso de Dispositivos</h3>
                  <select 
                    className="w-full sm:w-auto p-1.5 md:p-2 border border-slate-300 rounded-md bg-slate-50 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base" // Largura, padding e texto ajustados
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                  >
                    {dados.map((d, index) => (
                      <option key={index} value={d.mes}>{d.mes}</option>
                    ))}
                  </select>
                </div>
                {mesEstaZerado ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 font-medium text-center px-4 text-sm md:text-base">
                    Nenhum paciente em VM, TQT, GTT ou SNE registrado para este mês.
                  </div>
                ) : (
                  <div className="h-64 md:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosPizza} cx="50%" cy="50%" innerRadius={40} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" label={{ fontSize: '10px' }}> {/* Tamanho do raio e da fonte do label ajustados */}
                          {dadosPizza.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} /> {/* Tamanho da fonte da legenda ajustado */}
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