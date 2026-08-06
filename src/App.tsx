/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import TournamentsView from './components/TournamentsView';
import FinancialView from './components/FinancialView';
import PlayersView from './components/PlayersView';
import RankingView from './components/RankingView';
import AdminLogin from './components/AdminLogin';
import PublicView from './components/PublicView';
import RegistrationsView from './components/RegistrationsView';
import SettingsView from './components/SettingsView';
import VipCardsView from './components/VipCardsView';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [activeTab, setActiveTab] = useState('Painel');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    localStorage.setItem('isAdmin', String(isAdmin));
  }, [isAdmin]);

  if (view === 'public') return <PublicView onGoToAdmin={() => setView('admin')} />;

  // Permite visualizar o painel em desenvolvimento mesmo sem sessão
  const isDevMode = false; 

  if (loading && !isDevMode) {
    return <div className="flex h-screen items-center justify-center bg-[#050505] text-white">Carregando...</div>;
  }

  // Agora o login é tela cheia
  if (!isAdmin) return (
    <AdminLogin 
      onLogin={() => {
        setIsAdmin(true);
        setView('admin');
      }} 
      onBackToPublic={() => setView('public')}
    />
  );

  const handleLogout = () => {
    setIsAdmin(false);
    setView('public');
  };

  const renderView = () => {
    switch (activeTab) {
      case 'Painel': return <DashboardView />;
      case 'Campeonatos': return <TournamentsView />;
      case 'Financeiro': return <FinancialView />;
      case 'Jogadores': return <PlayersView />;
      case 'Inscrições': return <RegistrationsView />;
      case 'Ranking': return <RankingView />;
      case 'Configurações PIX': return <SettingsView />;
      case 'Cartões VIP': return <VipCardsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen w-full flex font-sans overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col w-full min-w-0">
        <Header 
          activeTab={activeTab} 
          onLogout={handleLogout} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        <div className="p-4 sm:p-8 flex flex-col gap-6 w-full">
          <h2 className="text-2xl font-black">{activeTab}</h2>
          
          {renderView()}
        </div>
      </main>
    </div>
  );
}

// ... rest of the file

