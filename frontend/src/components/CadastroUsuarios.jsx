import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Edit2, Trash2, Key, Shield, Mail, Lock, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function CadastroUsuarios() { // Renomeado para CadastroUsuarios para refletir o nome do arquivo
  // Estados para o formulário de cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('usuario');
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState({ tipo: '', mensagem: '' });

  // Estados para a lista de usuários
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  // Estados para os modais
  const [modalEdicao, setModalEdicao] = useState({
    aberto: false,
    id: null,
    nome: '',
    email: '',
    perfil: 'usuario'
  });
  const [modalReset, setModalReset] = useState({
    aberto: false,
    id: null,
    nome: '',
    novaSenha: ''
  });

  // 1. BUSCAR LISTA DE USUÁRIOS
  const buscarUsuarios = async () => {
    setCarregandoLista(true);
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resposta.ok) throw new Error("Erro ao buscar usuários.");
      const dados = await resposta.json();
      setListaUsuarios(dados);
    } catch (erro) {
      toast.error("Erro ao carregar usuários.");
      console.error("Erro ao buscar usuários:", erro);
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  // 2. CADASTRAR NOVO USUÁRIO
  const handleCadastrar = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setStatus({ tipo: '', mensagem: '' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/cadastrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome, email, senha, perfil })
      });

      // CORREÇÃO AQUI: Usar 'response.json()'
      const dados = await response.json(); 

      if (response.ok) { // Usar 'response.ok' para verificar o status
        setStatus({ tipo: 'sucesso', mensagem: dados.mensagem });
        setNome(''); setEmail(''); setSenha(''); setPerfil('usuario');
        buscarUsuarios(); 
      } else {
        setStatus({ tipo: 'erro', mensagem: dados.detail || 'Erro ao cadastrar usuário.' });
      }
    } catch (erro) {
      setStatus({ tipo: 'erro', mensagem: 'Erro de conexão com o servidor.' });
      console.error("Erro no cadastro:", erro);
    } finally {
      setCarregando(false);
    }
  };

  // 3. EXCLUIR USUÁRIO
  const handleExcluir = async (id, emailUsuario) => {
    if (!window.confirm(`Tem certeza que deseja remover o acesso de ${emailUsuario}?`)) return;
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        toast.success("Usuário excluído com sucesso!");
        buscarUsuarios();
      } else {
        const erro = await resposta.json();
        toast.error(erro.detail || "Erro ao excluir usuário.");
      }
    } catch (erro) {
      toast.error("Erro de conexão ao tentar excluir.");
      console.error("Erro ao excluir:", erro);
    }
  };

  // 4. SALVAR EDIÇÃO DE USUÁRIO
  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${modalEdicao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome: modalEdicao.nome, email: modalEdicao.email, perfil: modalEdicao.perfil })
      });

      if (resposta.ok) {
        toast.success("Dados atualizados com sucesso!");
        setModalEdicao({ aberto: false, id: null, nome: '', email: '', perfil: 'usuario' });
        buscarUsuarios();
      } else {
        const erro = await resposta.json();
        toast.error(erro.detail || "Erro ao atualizar.");
      }
    } catch (erro) {
      toast.error("Erro de conexão.");
      console.error("Erro ao salvar edição:", erro);
    }
  };

  // 5. SALVAR NOVA SENHA
  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token_melhor_em_casa');
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/reset-senha/${modalReset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nova_senha: modalReset.novaSenha })
      });

      if (resposta.ok) {
        toast.success("Senha resetada com sucesso!");
        setModalReset({ aberto: false, id: null, nome: '', novaSenha: '' });
      } else {
        const erro = await resposta.json();
        toast.error(erro.detail || "Erro ao resetar senha.");
      }
    } catch (erro) {
      toast.error("Erro de conexão.");
      console.error("Erro ao resetar senha:", erro);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8"> {/* Padding responsivo */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* SEÇÃO DE CADASTRO DE NOVO USUÁRIO */}
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-8"> {/* Padding responsivo */}
        <div className="flex items-center gap-3 mb-6">
          <UserPlus size={20} className="md:size-6 text-blue-600" /> {/* Tamanho do ícone responsivo */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Cadastrar Novo Usuário</h2> {/* Tamanho da fonte responsivo */}
            <p className="text-sm md:text-base text-slate-500">Adicione novos membros à sua equipe com diferentes níveis de acesso.</p> {/* Tamanho da fonte responsivo */}
          </div>
        </div>

        <form onSubmit={handleCadastrar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base" // Padding e tamanho da fonte ajustados
                  placeholder="Nome do usuário"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base" // Padding e tamanho da fonte ajustados
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength="6"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base" // Padding e tamanho da fonte ajustados
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Perfil de Acesso</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none text-sm md:text-base" // Padding e tamanho da fonte ajustados
                >
                  <option value="usuario">Usuário Padrão</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 text-white font-bold py-2.5 md:py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base md:text-lg" // Padding e tamanho da fonte ajustados
          >
            {carregando ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cadastrando...
              </>
            ) : (
              <>
                <UserPlus size={20} /> Cadastrar Usuário
              </>
            )}
          </button>
        </form>

        {status.tipo && (
          <div className={`mt-6 p-3 md:p-4 rounded-xl flex items-center gap-3 border text-sm md:text-base ${status.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}> {/* Padding e tamanho da fonte ajustados */}
            {status.tipo === 'sucesso' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium">{status.mensagem}</p>
          </div>
        )}
      </div>

      {/* SEÇÃO DE LISTA DE USUÁRIOS */}
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200"> {/* Padding responsivo */}
        <div className="flex items-center gap-3 mb-6">
          <Users size={20} className="md:size-6 text-purple-600" /> {/* Tamanho do ícone responsivo */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Usuários Cadastrados</h2> {/* Tamanho da fonte responsivo */}
            <p className="text-sm md:text-base text-slate-500">Gerencie os usuários existentes, edite seus dados ou redefina senhas.</p> {/* Tamanho da fonte responsivo */}
          </div>
        </div>

        {carregandoLista ? (
          <div className="text-center text-slate-500 py-8">Carregando lista de usuários...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider">Nome</th> {/* Padding e tamanho da fonte ajustados */}
                  <th scope="col" className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider">Email</th> {/* Padding e tamanho da fonte ajustados */}
                  <th scope="col" className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider">Perfil</th> {/* Padding e tamanho da fonte ajustados */}
                  <th scope="col" className="px-3 md:px-4 py-3 text-right text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider">Ações</th> {/* Padding e tamanho da fonte ajustados */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {listaUsuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="px-3 md:px-4 py-3 whitespace-nowrap text-sm md:text-base text-slate-800">{usuario.nome}</td> {/* Padding e tamanho da fonte ajustados */}
                    <td className="px-3 md:px-4 py-3 whitespace-nowrap text-sm md:text-base text-slate-600">{usuario.email}</td> {/* Padding e tamanho da fonte ajustados */}
                    <td className="px-3 md:px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${usuario.perfil === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}> {/* Padding ajustado */}
                        {usuario.perfil === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-1 md:gap-2"> {/* Espaçamento responsivo */}
                        <button
                          onClick={() => setModalEdicao({ aberto: true, id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil })}
                          className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" // Padding responsivo
                          title="Editar Usuário"
                        >
                          <Edit2 size={16} className="md:size-5" /> {/* Tamanho do ícone responsivo */}
                        </button>
                        <button
                          onClick={() => setModalReset({ aberto: true, id: usuario.id, nome: usuario.nome, novaSenha: '' })}
                          className="p-1.5 md:p-2 text-amber-600 hover:bg-amber-50 rounded-md transition-colors" // Padding responsivo
                          title="Resetar Senha"
                        >
                          <Key size={16} className="md:size-5" /> {/* Tamanho do ícone responsivo */}
                        </button>
                        <button
                          onClick={() => handleExcluir(usuario.id, usuario.email)}
                          className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" // Padding responsivo
                          title="Excluir Usuário"
                        >
                          <Trash2 size={16} className="md:size-5" /> {/* Tamanho do ícone responsivo */}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE USUÁRIO */}
      {modalEdicao.aberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"> {/* Padding no modal container */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xl w-full max-w-md"> {/* Padding ajustado */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold text-slate-800">Editar Usuário</h3> {/* Tamanho da fonte ajustado */}
              <button onClick={() => setModalEdicao({ ...modalEdicao, aberto: false })} className="text-slate-400 hover:text-slate-600"><X size={20} className="md:size-6" /></button> {/* Tamanho do ícone ajustado */}
            </div>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome</label>
                <input type="text" required value={modalEdicao.nome} onChange={(e) => setModalEdicao({ ...modalEdicao, nome: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base" /> {/* Padding e tamanho da fonte ajustados */}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" required value={modalEdicao.email} onChange={(e) => setModalEdicao({ ...modalEdicao, email: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base" /> {/* Padding e tamanho da fonte ajustados */}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Perfil de Acesso</label>
                <select
                  value={modalEdicao.perfil}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, perfil: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm md:text-base"
                > {/* Padding e tamanho da fonte ajustados */}
                  <option value="usuario">Usuário Padrão</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 text-base md:text-lg">Salvar Alterações</button> {/* Padding e tamanho da fonte ajustados */}
            </form>
          </div >
        </div >
      )}

      {/* MODAL DE RESET DE SENHA */}
      {modalReset.aberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"> {/* Padding no modal container */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xl w-full max-w-md"> {/* Padding ajustado */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold text-slate-800">Resetar Senha</h3> {/* Tamanho da fonte ajustado */}
              <button onClick={() => setModalReset({ ...modalReset, aberto: false })} className="text-slate-400 hover:text-slate-600"><X size={20} className="md:size-6" /></button> {/* Tamanho do ícone ajustado */}
            </div>
            <p className="text-sm md:text-base text-slate-500 mb-4">Defina uma nova senha para <strong>{modalReset.nome}</strong>.</p> {/* Tamanho da fonte ajustado */}
            <form onSubmit={salvarNovaSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nova Senha</label>
                <input type="password" required minLength="6" value={modalReset.novaSenha} onChange={(e) => setModalReset({ ...modalReset, novaSenha: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm md:text-base" placeholder="Mínimo 6 caracteres" /> {/* Padding e tamanho da fonte ajustados */}
              </div>
              <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-lg hover:bg-amber-600 text-base md:text-lg">Confirmar Nova Senha</button> {/* Padding e tamanho da fonte ajustados */}
            </form>
          </div >
        </div >
      )}

    </div >
  );
}