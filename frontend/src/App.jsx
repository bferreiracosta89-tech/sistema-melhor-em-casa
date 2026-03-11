import React, { useState, useEffect } from 'react';
import { PieChart } from 'lucide-react';

// Importando o Layout (Esqueleto da página)
import LayoutPrincipal from './layouts/LayoutPrincipal';

// Importando as Telas (Componentes)
import Login from './components/Login';
import DashboardIndicadoresGerais from './components/DashboardIndicadoresGerais';
import UploadPlanilha from './components/UploadPlanilha';
import GeradorRelatorios from './components/GeradorRelatorios';
import FormularioManual from './components/FormularioManual'; 
import TabelaDados  from './components/TabelaDados';
import CadastroUsuarios from './components/CadastroUsuarios';

export default function App() {
  // 1. Estados do sistema
  const [estaLogado, setEstaLogado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('dashboard'); // Começa na tela de gráficos

  // 2. Verifica se já está logado ao abrir o site
  useEffect(() => {
    const logado = localStorage.getItem('logado') === 'true';
    if (logado) {
      setEstaLogado(true);
    }
  }, []);

  // 3. Função que decide qual tela mostrar no meio do Layout
  const renderizarConteudo = () => {
    switch (abaAtiva) {
      case 'dashboard':
        return <DashboardIndicadoresGerais />;
      case 'upload':
        return <UploadPlanilha />;
      case 'relatorios':
        return <GeradorRelatorios />;
      case 'digitacao': 
        return <FormularioManual />;
      case 'tabela_dados':
        return <TabelaDados />;
      case 'usuarios':
        return <CadastroUsuarios />;
      default:
        return <DashboardIndicadoresGerais />;
    }
  };

  // 4. Se NÃO estiver logado, mostra APENAS a tela de Login
  if (!estaLogado) {
    return <Login onLoginSucesso={() => setEstaLogado(true)} />;
  }

  // 5. Se ESTIVER logado, mostra o Layout com o menu lateral funcionando
  return (
    <LayoutPrincipal abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}>
      {renderizarConteudo()}
    </LayoutPrincipal>
  );
}