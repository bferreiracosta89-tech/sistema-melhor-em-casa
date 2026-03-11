import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Lock, CheckCircle, AlertCircle, Trash2, Users, User, Edit2, Key, X, Shield } from 'lucide-react';

export default function CadastroUsuarios() {
  // Estados do Cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('usuario'); // Novo estado para o perfil
  const [status, setStatus] = useState({ tipo: '', mensagem: '' });
  const [carregando, setCarregando] = useState(false);

  // Estados da Lista
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  // Estados dos Modais
  const [modalEdicao, setModalEdicao] = useState({ aberto: false, id: null, nome: '', email: '', perfil: 'usuario' });
  const [modalReset, setModalReset] = useState({ aberto: false, id: null, nome: '', novaSenha: '' });

  const buscarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch('`${import.meta.env.VITE_API_URL}/api/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setListaUsuarios(dados);
      }
    } catch (erro) {
      console.error("Erro ao buscar usuários:", erro);
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setStatus({ tipo: '', mensagem: '' });

    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch('`${import.meta.env.VITE_API_URL}/api/usuarios/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome, email, senha, perfil }) // Enviando o perfil
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setStatus({ tipo: 'sucesso', mensagem: dados.mensagem });
        setNome(''); setEmail(''); setSenha(''); setPerfil('usuario');
        buscarUsuarios(); 
      } else {
        setStatus({ tipo: 'erro', mensagem: dados.detail || 'Erro ao cadastrar usuário.' });
      }
    } catch (erro) {
      setStatus({ tipo: 'erro', mensagem: 'Erro de conexão com o servidor.' });
    } finally {
      setCarregando(false);
    }
  };

  const handleExcluir = async (id, emailUsuario) => {
    if (!window.confirm(`Tem certeza que deseja remover o acesso de ${emailUsuario}?`)) return;
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(``${import.meta.env.VITE_API_URL}/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) buscarUsuarios();
      else alert("Erro ao excluir usuário.");
    } catch (erro) {
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(``${import.meta.env.VITE_API_URL}/api/usuarios/${modalEdicao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome: modalEdicao.nome, email: modalEdicao.email, perfil: modalEdicao.perfil })
      });

      if (resposta.ok) {
        alert("Dados atualizados com sucesso!");
        setModalEdicao({ aberto: false, id: null, nome: '', email: '', perfil: 'usuario' });
        buscarUsuarios();
      } else {
        const erro = await resposta.json();
        alert(erro.detail || "Erro ao atualizar.");
      }
    } catch (erro) {
      alert("Erro de conexão.");
    }
  };

  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(``${import.meta.env.VITE_API_URL}/api/usuarios/${modalReset.id}/reset-senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nova_senha: modalReset.novaSenha })
      });

      if (resposta.ok) {
        alert("Senha redefinida com sucesso!");
        setModalReset({ aberto: false, id: null, nome: '', novaSenha: '' });
      } else {
        alert("Erro ao redefinir senha.");
      }
    } catch (erro) {
      alert("Erro de conexão.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">

      {/* Formulário de Cadastro */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Cadastrar Novo Usuário</h2>
            <p className="text-slate-500">Adicione membros da equipe e defina suas permissões</p>
          </div>
        </div>

        <form onSubmit={handleCadastrar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} /> Nome Completo
              </label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Dr. João Silva" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Shield size={16} /> Perfil de Acesso
              </label>
              <select 
                value={perfil} 
                onChange={(e) => setPerfil(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="usuario">Usuário Padrão (Acesso Limitado)</option>
                <option value="admin">Administrador (Acesso Total)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Mail size={16} /> Email de Acesso
              </label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="exemplo@hospital.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Lock size={16} /> Senha Inicial
              </label>
              <input type="password" required minLength="6" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mínimo de 6 caracteres" />
            </div>
          </div>

          <button type="submit" disabled={carregando} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 flex justify-center items-center gap-2">
            {carregando ? 'Cadastrando...' : 'Criar Conta'}
          </button>

          {status.tipo === 'sucesso' && <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200"><CheckCircle size={20} /> {status.mensagem}</div>}
          {status.tipo === 'erro' && <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200"><AlertCircle size={20} /> {status.mensagem}</div>}
        </form>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Equipe Cadastrada</h2>
            <p className="text-slate-500">Gerencie quem tem acesso ao painel</p>
          </div>
        </div>

        {carregandoLista ? (
          <p className="text-center text-slate-500 py-4">Carregando equipe...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold rounded-tl-lg">Nome</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Perfil</th>
                  <th className="p-4 font-semibold text-right rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaUsuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{user.nome || 'Sem nome'}</td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.perfil === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.perfil === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => setModalEdicao({ aberto: true, id: user.id, nome: user.nome, email: user.email, perfil: user.perfil || 'usuario' })} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Editar Dados">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => setModalReset({ aberto: true, id: user.id, nome: user.nome, novaSenha: '' })} className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-lg transition-colors" title="Resetar Senha">
                        <Key size={18} />
                      </button>
                      <button onClick={() => handleExcluir(user.id, user.email)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remover Acesso">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {modalEdicao.aberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Editar Usuário</h3>
              <button onClick={() => setModalEdicao({ ...modalEdicao, aberto: false })} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome</label>
                <input type="text" required value={modalEdicao.nome} onChange={(e) => setModalEdicao({...modalEdicao, nome: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" required value={modalEdicao.email} onChange={(e) => setModalEdicao({...modalEdicao, email: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Perfil de Acesso</label>
                <select 
                  value={modalEdicao.perfil} 
                  onChange={(e) => setModalEdicao({...modalEdicao, perfil: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="usuario">Usuário Padrão</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RESET DE SENHA */}
      {modalReset.aberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Resetar Senha</h3>
              <button onClick={() => setModalReset({ ...modalReset, aberto: false })} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Defina uma nova senha para <strong>{modalReset.nome}</strong>.</p>
            <form onSubmit={salvarNovaSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nova Senha</label>
                <input type="password" required minLength="6" value={modalReset.novaSenha} onChange={(e) => setModalReset({...modalReset, novaSenha: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Mínimo 6 caracteres" />
              </div>
              <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2 rounded-lg hover:bg-amber-600">Confirmar Nova Senha</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}