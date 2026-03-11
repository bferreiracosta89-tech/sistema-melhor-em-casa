import React, { useState } from 'react';

export default function FormularioManual() {
  const [formData, setFormData] = useState({
    mes: 'Janeiro',
    pacientes_ativos: '', 
    admissoes: '',
    altas_clinicas: '',
    obitos: '',
    feridas_ativas: '',
    pacientes_vm: '',
    pacientes_tqt: '',
    pacientes_gtt: '', 
    pacientes_sne: '', 
    cuidados_paliativos: '',
    uso_atb: '', 
    ad1: '',
    ad2: '',
    ad3: ''
  });

  const [mensagem, setMensagem] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dadosParaEnviar = {
      mes: formData.mes,
      pacientes_ativos: Number(formData.pacientes_ativos) || 0, 
      admissoes: Number(formData.admissoes) || 0,
      altas_clinicas: Number(formData.altas_clinicas) || 0,
      obitos: Number(formData.obitos) || 0,
      feridas_ativas: Number(formData.feridas_ativas) || 0,
      pacientes_vm: Number(formData.pacientes_vm) || 0,
      pacientes_tqt: Number(formData.pacientes_tqt) || 0,
      pacientes_gtt: Number(formData.pacientes_gtt) || 0,
      pacientes_sne: Number(formData.pacientes_sne) || 0,
      cuidados_paliativos: Number(formData.cuidados_paliativos) || 0,
      uso_atb: Number(formData.uso_atb) || 0, 
      ad1: Number(formData.ad1) || 0, 
      ad2: Number(formData.ad2) || 0,
      ad3: Number(formData.ad3) || 0
    };

    try {
      // 1. Pega o token salvo no login
      const token = localStorage.getItem('token_melhor_em_casa');

      // 2. Envia os dados junto com o token de segurança
      const response = await fetch('https://api-melhor-em-casa.onrender.com/api/indicadores/manual', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // A mágica da segurança aqui!
        },
        body: JSON.stringify(dadosParaEnviar)
      });

      if (response.ok) {
       setMensagem('✅ Dados salvos com sucesso no Banco de Dados!');
        setFormData({ 
          mes: 'Janeiro',
          pacientes_ativos: '', admissoes: '', altas_clinicas: '', obitos: '', feridas_ativas: '', 
          pacientes_vm: '', pacientes_tqt: '', pacientes_gtt: '', pacientes_sne: '', 
          cuidados_paliativos: '', uso_atb: '',
          ad1: '', ad2: '', ad3: ''
        });
      } else {
        setMensagem('❌ Erro ao salvar os dados. Verifique o servidor.');
      }
    } catch (error) {
      console.error("Erro:", error);
      setMensagem('❌ Erro de conexão com a API.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Digitação Manual de Indicadores</h2>

      {mensagem && (
        <div className={`p-4 mb-6 rounded-md font-semibold ${mensagem.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensagem}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-md border border-gray-200">

        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <label className="block text-sm font-bold text-blue-800 mb-2">Mês de Referência</label>
          <select name="mes" value={formData.mes} onChange={handleChange} className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-semibold text-gray-700">
            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna 1: Fluxo Geral */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Fluxo de Pacientes</h3>

            <div>
              <label className="block text-sm font-bold text-purple-700 mb-1">Pacientes Ativos no Mês</label>
              <input type="number" name="pacientes_ativos" value={formData.pacientes_ativos} onChange={handleChange} className="w-full p-2 border border-purple-300 bg-purple-50 rounded-md focus:ring-purple-500" placeholder="Ex: 150" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Admissões no mês</label>
              <input type="number" name="admissoes" value={formData.admissoes} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 120" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Altas Clínicas</label>
              <input type="number" name="altas_clinicas" value={formData.altas_clinicas} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 95" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Óbitos</label>
              <input type="number" name="obitos" value={formData.obitos} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 5" />
            </div>
          </div>

          {/* Coluna 2: Cuidados Especiais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Cuidados Especiais</h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Feridas Ativas (Total)</label>
              <input type="number" name="feridas_ativas" value={formData.feridas_ativas} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 15" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Pacientes em VM</label>
                <input type="number" name="pacientes_vm" value={formData.pacientes_vm} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 8" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Pacientes com TQT</label>
                <input type="number" name="pacientes_tqt" value={formData.pacientes_tqt} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 4" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Pacientes com GTT</label>
                <input type="number" name="pacientes_gtt" value={formData.pacientes_gtt} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Pacientes com SNE</label>
                <input type="number" name="pacientes_sne" value={formData.pacientes_sne} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 7" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Pacientes em Cuidados Paliativos</label>
              <input type="number" name="cuidados_paliativos" value={formData.cuidados_paliativos} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: 12" />
            </div>
            <div>
              <label className="block text-sm font-bold text-red-600 mb-1">Uso de Antibióticos (ATB)</label>
              <input type="number" name="uso_atb" value={formData.uso_atb} onChange={handleChange} className="w-full p-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 bg-red-50" placeholder="Ex: 25" />
            </div>
          </div>

          {/* Bloco de Complexidade */}
          <div className="col-span-full mt-4">
            <h4 className="text-md font-semibold text-slate-700 mb-3 border-b pb-2">Complexidade de Pacientes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pacientes AD1</label>
                <input type="number" name="ad1" value={formData.ad1} onChange={handleChange} min="0" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pacientes AD2</label>
                <input type="number" name="ad2" value={formData.ad2} onChange={handleChange} min="0" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 8" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pacientes AD3</label>
                <input type="number" name="ad3" value={formData.ad3} onChange={handleChange} min="0" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 4" />
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t">
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 shadow-lg">
            💾 Salvar Todos os Dados
          </button>
        </div>
      </form>
    </div>
  );
}