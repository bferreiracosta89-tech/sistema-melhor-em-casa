import React, { useState } from 'react';
import { LayoutDashboard, Upload, FileText, LogOut, User, Activity, Edit, UserPlus, PieChart, Menu, X } from 'lucide-react';
import InfoUsuario from '../components/InfoUsuario';

export default function LayoutPrincipal({ children, abaAtiva, setAbaAtiva }) {
  // NOVO ESTADO: Controla se o menu do celular está aberto ou fechado
  const [menuAberto, setMenuAberto] = useState(false);

  // 1. Descobre qual é o perfil do usuário lendo o Token
  let perfilUsuario = 'usuario';
  const token = localStorage.getItem('token_melhor_em_casa');

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      perfilUsuario = payload.perfil || 'usuario';
    } catch (e) {
      console.error("Erro ao ler token de segurança");
    }
  }

  // 2. Definição dos itens do menu lateral
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, adminOnly: false },
    { id: 'tabela_dados', label: 'Tabela de Dados', icon: FileText, adminOnly: false },
    { id: 'relatorios', label: 'Relatórios IA', icon: FileText, adminOnly: false },
    { id: 'digitacao', label: 'Digitação', icon: Edit, adminOnly: true },
    { id: 'upload', label: 'Importar Planilha', icon: Upload, adminOnly: true },
    { id: 'usuarios', label: 'Equipe / Usuários', icon: UserPlus, adminOnly: true }, 
  ];

  // 3. Filtra o menu
  const menuFiltrado = menuItems.filter(item => {
    if (item.adminOnly && perfilUsuario !== 'admin') return false;
    return true;
  });

  const fazerLogout = () => {
    localStorage.removeItem('token_melhor_em_casa');
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* FUNDO ESCURO NO CELULAR (Quando o menu abre) */}
      {menuAberto && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* MENU LATERAL (SIDEBAR) - Agora Responsivo */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl md:shadow-sm print:hidden
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${menuAberto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Cabeçalho do Menu */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
              <img src="/logo-melhor-em-casa.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-xs font-bold text-slate-800 tracking-wide leading-tight">Programa<br/>Melhor em Casa</h1>
          </div>

          {/* Botão de fechar (Só aparece no celular) */}
          <button 
            onClick={() => setMenuAberto(false)}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuFiltrado.map((item) => {
            const Icon = item.icon;
            const ativo = abaAtiva === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setAbaAtiva(item.id);
                  setMenuAberto(false); // Fecha o menu ao clicar (útil no celular)
                }}
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
      <main className="flex-1 flex flex-col min-w-0 relative">

        {/* Cabeçalho (Header) */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 print:hidden">

          <div className="flex items-center gap-3">
            {/* Botão Hambúrguer (Só aparece no celular) */}
            <button 
              onClick={() => setMenuAberto(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-xl md:text-2xl font-bold text-slate-800 truncate">
              {menuItems.find(m => m.id === abaAtiva)?.label || 'Dashboard'}
            </h2>
          </div>

          {/* Perfil do Usuário */}
          <div className="flex items-center gap-4">
            <div className="mt-6 text-right hidden md:block">
              <InfoUsuario />
            </div>
            <div className="bg-blue-100 p-2 md:p-3 rounded-full border border-blue-200 shrink-0">
              <User className="text-blue-700" size={20} />
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}