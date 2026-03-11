import React from 'react';
import { LayoutDashboard, Upload, FileText, LogOut, User, Activity, Edit, UserPlus, PieChart } from 'lucide-react';
import InfoUsuario from '../components/InfoUsuario';

export default function LayoutPrincipal({ children, abaAtiva, setAbaAtiva }) {

  // 1. Descobre qual é o perfil do usuário lendo o Token
  let perfilUsuario = 'usuario'; // Padrão é usuário comum
  const token = localStorage.getItem('token_melhor_em_casa');

  if (token) {
    try {
      // Decodifica a parte do meio do token (payload) para ler o perfil
      const payload = JSON.parse(atob(token.split('.')[1]));
      perfilUsuario = payload.perfil || 'usuario';
    } catch (e) {
      console.error("Erro ao ler token de segurança");
    }
  }

  // 2. Definição dos itens do menu lateral com a regra "adminOnly"
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, adminOnly: false },
    {id: 'tabela_dados', label: 'Tabela de Dados', icon: FileText, adminOnly: false },
    { id: 'relatorios', label: 'Relatórios IA', icon: FileText, adminOnly: false },
    { id: 'digitacao', label: 'Digitação', icon: Edit, adminOnly: true },
    { id: 'upload', label: 'Importar Planilha', icon: Upload, adminOnly: true },
    { id: 'usuarios', label: 'Equipe / Usuários', icon: UserPlus, adminOnly: true }, 
  ];

  // 3. Filtra o menu: se não for admin, esconde os botões restritos
  const menuFiltrado = menuItems.filter(item => {
    if (item.adminOnly && perfilUsuario !== 'admin') {
      return false; // Esconde o botão
    }
    return true; // Mostra o botão
  });

  const fazerLogout = () => {
    localStorage.removeItem('token_melhor_em_casa');
    window.location.reload(); // Recarrega a página para voltar à tela de login
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">

      {/* MENU LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 print:hidden">
        {/* Espaço para a Logo do Hospital */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg">
            <img 
              src="/logo-melhor-em-casa.png" 
              alt="Logo Melhor em Casa" 
              className="w-12 h-12 object-contain" 
            />
          </div>
          <div>
            <h1 className="text-xs font-bold text-Black tracking-wide">Programa Melhor em Casa</h1>
          </div>
        </div>

        {/* Navegação - AGORA USANDO O MENU FILTRADO */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuFiltrado.map((item) => {
            const Icon = item.icon;
            const ativo = abaAtiva === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setAbaAtiva(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  ativo 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon size={20} className={ativo ? 'text-blue-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Botão de Sair */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={fazerLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL (DIREITA) */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Cabeçalho (Header) */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-20 print:hidden">
          <h2 className="text-2xl font-bold text-slate-800">
            {menuItems.find(m => m.id === abaAtiva)?.label || 'Dashboard'}
          </h2>

          {/* Perfil do Usuário */}
          <div className="flex items-center gap-4 ">
            <div className="mt-6 text-right hidden md:block">
              <InfoUsuario />
            </div>
            <div className="bg-blue-100 p-3 rounded-full border border-blue-200">
              <User className="text-blue-700" size={20} />
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico (Aqui entram os gráficos, upload ou relatórios) */}
        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}