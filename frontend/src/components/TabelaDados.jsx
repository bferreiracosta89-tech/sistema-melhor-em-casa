import React, { useState, useEffect } from 'react';
import { Trash2, Edit, FileSpreadsheet, X, Save, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function TabelaDados() {
  // 1. TODOS OS ESTADOS NO TOPO (Regra do React)
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [itemEditando, setItemEditando] = useState(null);
  const [exportando, setExportando] = useState(false); // <-- Movido para cá!

  // 2. BUSCAR DADOS
  const buscarDados = async () => {
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch('${import.meta.env.VITE_API_URL}/api/indicadores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resposta.ok) throw new Error("Acesso negado");

      const dadosBanco = await resposta.json();
      setDados(dadosBanco.sort((a, b) => b.id - a.id)); 
    } catch (erro) {
      toast.error("Erro ao buscar dados. Faça login novamente.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { buscarDados(); }, []);

  // 3. EXCLUIR DADOS
  const excluirRegistro = async (id, mes) => {
    if (window.confirm(`Excluir permanentemente os dados de ${mes}?`)) {
      try {
        const token = localStorage.getItem('token_melhor_em_casa');
        const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/indicadores/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (resposta.ok) {
          setDados(dados.filter(item => item.id !== id));
          toast.success(`${mes} excluído!`);
        } else {
          toast.error("Erro ao excluir.");
        }
      } catch (erro) {
        toast.error("Erro de conexão.");
      }
    }
  };

  // 4. EDITAR DADOS
  const salvarEdicao = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Salvando todos os dados...');

    try {
      const dadosParaEnviar = {
        mes: itemEditando.mes_ano || itemEditando.mes,
        admissoes: parseInt(itemEditando.admissoes) || 0,
        altas_clinicas: parseInt(itemEditando.altas_clinicas || itemEditando.altas) || 0,
        obitos: parseInt(itemEditando.obitos) || 0,
        pacientes_ativos: parseInt(itemEditando.pacientes_ativos) || 0,
        feridas_ativas: parseInt(itemEditando.feridas_ativas) || 0,
        uso_atb: parseInt(itemEditando.uso_atb) || 0,
        cuidados_paliativos: parseInt(itemEditando.cuidados_paliativos) || 0,
        pacientes_vm: parseInt(itemEditando.pacientes_vm) || 0,
        pacientes_tqt: parseInt(itemEditando.pacientes_tqt) || 0,
        pacientes_gtt: parseInt(itemEditando.pacientes_gtt) || 0,
        pacientes_sne: parseInt(itemEditando.pacientes_sne) || 0,
        ad1: parseInt(itemEditando.ad1) || 0,
        ad2: parseInt(itemEditando.ad2) || 0,
        ad3: parseInt(itemEditando.ad3) || 0
      };

      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/indicadores/${itemEditando.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosParaEnviar)
      });

      if (resposta.ok) {
        toast.success('Dados atualizados com sucesso!', { id: toastId });
        setItemEditando(null);
        buscarDados(); 
      } else {
        const erroBanco = await resposta.json();
        const detalheErro = erroBanco.detail && Array.isArray(erroBanco.detail) 
          ? `Campo inválido: ${erroBanco.detail[0].loc[1]}` 
          : erroBanco.detail || 'Erro desconhecido no banco';
        toast.error(`Erro: ${detalheErro}`, { id: toastId, duration: 5000 });
      }
    } catch (erro) {
      toast.error('Erro de conexão com o servidor.', { id: toastId });
    }
  };

  // 5. EXPORTAR PARA EXCEL (Movido para cima)
  const exportarParaExcel = async () => {
    setExportando(true);
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch('${import.meta.env.VITE_API_URL}/api/indicadores/exportar', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resposta.ok) throw new Error("Erro ao exportar dados");

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Relatorio_MelhorEmCasa.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (erro) {
      console.error("Erro:", erro);
      alert("Não foi possível exportar a planilha.");
    } finally {
      setExportando(false);
    }
  };

  const InputEdicao = ({ label, campo }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm"
        value={itemEditando[campo] || 0}
        onChange={e => setItemEditando({...itemEditando, [campo]: e.target.value})}
      />
    </div>
  );

  // 6. O RETURN DE CARREGAMENTO DEVE FICAR AQUI EMBAIXO
  if (carregando) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full text-blue-700">
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">Banco de Dados Completo</h2>
            <p className="text-gray-500 text-sm">Visualize e edite todos os indicadores clínicos e gerenciais</p>
          </div>
          <div>
            <button
              onClick={exportarParaExcel}
              disabled={exportando}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors shadow-sm ${
                exportando ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Download size={20} />
              {exportando ? 'Gerando Excel...' : 'Exportar Excel'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider">
                <th className="p-3 font-semibold sticky left-0 bg-gray-900 z-10">Mês</th>
                <th className="p-3 font-semibold text-center bg-gray-700">Ações</th>
                <th className="p-3 font-semibold text-center">Admissões</th>
                <th className="p-3 font-semibold text-center">Altas</th>
                <th className="p-3 font-semibold text-center">Óbitos</th>
                <th className="p-3 font-semibold text-center">Ativos</th>
                <th className="p-3 font-semibold text-center text-yellow-300">Feridas</th>
                <th className="p-3 font-semibold text-center text-yellow-300">ATB</th>
                <th className="p-3 font-semibold text-center text-yellow-300">Paliação</th>
                <th className="p-3 font-semibold text-center text-blue-300">VM</th>
                <th className="p-3 font-semibold text-center text-blue-300">TQT</th>
                <th className="p-3 font-semibold text-center text-blue-300">GTT</th>
                <th className="p-3 font-semibold text-center text-blue-300">SNE</th>
                <th className="p-3 font-semibold text-center text-purple-300">AD1</th>
                <th className="p-3 font-semibold text-center text-purple-300">AD2</th>
                <th className="p-3 font-semibold text-center text-purple-300">AD3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {dados.map((linha) => (
                <tr key={linha.id} className="hover:bg-blue-50">
                  <td className="p-3 font-bold text-gray-800 sticky left-0 bg-white border-r">{linha.mes_ano || linha.mes}</td>
                  <td className="p-3 text-center flex justify-center gap-2 border-r">
                    <button onClick={() => setItemEditando(linha)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Edit size={16} /></button>
                    <button onClick={() => excluirRegistro(linha.id, linha.mes_ano || linha.mes)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
                  </td>
                  <td className="p-3 text-center">{linha.admissoes}</td>
                  <td className="p-3 text-center">{linha.altas_clinicas || linha.altas}</td>
                  <td className="p-3 text-center text-red-600 font-medium">{linha.obitos}</td>
                  <td className="p-3 text-center font-bold text-blue-600">{linha.pacientes_ativos}</td>
                  <td className="p-3 text-center bg-yellow-50">{linha.feridas_ativas}</td>
                  <td className="p-3 text-center bg-yellow-50">{linha.uso_atb}</td>
                  <td className="p-3 text-center bg-yellow-50">{linha.cuidados_paliativos}</td>
                  <td className="p-3 text-center bg-blue-50">{linha.pacientes_vm}</td>
                  <td className="p-3 text-center bg-blue-50">{linha.pacientes_tqt}</td>
                  <td className="p-3 text-center bg-blue-50">{linha.pacientes_gtt}</td>
                  <td className="p-3 text-center bg-blue-50">{linha.pacientes_sne}</td>
                  <td className="p-3 text-center bg-purple-50">{linha.ad1}</td>
                  <td className="p-3 text-center bg-purple-50">{linha.ad2}</td>
                  <td className="p-3 text-center bg-purple-50">{linha.ad3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {itemEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">Editar Dados Completos: {itemEditando.mes_ano || itemEditando.mes}</h3>
              <button onClick={() => setItemEditando(null)} className="text-gray-300 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={salvarEdicao} className="p-6 overflow-y-auto space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">1. Fluxo de Pacientes</h4>
                <div className="grid grid-cols-4 gap-4">
                  <InputEdicao label="Admissões" campo="admissoes" />
                  <InputEdicao label="Altas" campo="altas_clinicas" />
                  <InputEdicao label="Óbitos" campo="obitos" />
                  <InputEdicao label="Pacientes Ativos" campo="pacientes_ativos" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-3 border-b border-yellow-200 pb-2">2. Perfil Clínico</h4>
                <div className="grid grid-cols-3 gap-4">
                  <InputEdicao label="Feridas Ativas" campo="feridas_ativas" />
                  <InputEdicao label="Uso de ATB" campo="uso_atb" />
                  <InputEdicao label="Cuidados Paliativos" campo="cuidados_paliativos" />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 border-b border-blue-200 pb-2">3. Dispositivos</h4>
                <div className="grid grid-cols-4 gap-4">
                  <InputEdicao label="Ventilação (VM)" campo="pacientes_vm" />
                  <InputEdicao label="Traqueostomia (TQT)" campo="pacientes_tqt" />
                  <InputEdicao label="Gastrostomia (GTT)" campo="pacientes_gtt" />
                  <InputEdicao label="Sonda (SNE)" campo="pacientes_sne" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-bold text-purple-800 mb-3 border-b border-purple-200 pb-2">4. Complexidade (AD)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <InputEdicao label="AD1" campo="ad1" />
                  <InputEdicao label="AD2" campo="ad2" />
                  <InputEdicao label="AD3" campo="ad3" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white py-2 border-t mt-4">
                <button type="button" onClick={() => setItemEditando(null)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-md">
                  <Save size={20} /> Salvar Todos os Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}