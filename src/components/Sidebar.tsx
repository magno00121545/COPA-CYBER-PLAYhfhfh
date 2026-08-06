import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Swords, DollarSign, Users, UserCheck, Trophy, Settings, Radio, CreditCard } from 'lucide-react';
import { playNewRegistrationSound } from '../lib/audioNotification';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    fetchPendingCount();

    // 1. Supabase Realtime Subscription
    const channel = supabase
      .channel('sidebar-registrations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_registrations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playNewRegistrationSound();
          }
          fetchPendingCount();
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // 2. Fallback polling every 3 seconds for 100% real-time reliability
    const interval = setInterval(fetchPendingCount, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function fetchPendingCount() {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('status', 'Pendente');
    
    const count = data?.length || 0;
    setPendingCount((prev) => {
      if (count > prev && prev !== 0) {
        // New item arrived via polling
        playNewRegistrationSound();
      }
      return count;
    });
  }

  const menuItems = [
    { name: 'Painel', icon: LayoutDashboard },
    { name: 'Inscrições', icon: UserCheck, badge: pendingCount },
    { name: 'Campeonatos', icon: Swords },
    { name: 'Ranking', icon: Trophy },
    { name: 'Jogadores', icon: Users },
    { name: 'Financeiro', icon: DollarSign },
    { name: 'Cartões VIP', icon: CreditCard },
    { name: 'Configurações PIX', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-[#39FF14]/20 flex flex-col z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-[#39FF14] text-2xl font-black tracking-tighter">CYBER PLAY</h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Gerenciador de Campeonatos</p>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500">✕</button>
        </div>
        <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <button 
              key={item.name}
              onClick={() => setActiveTab(item.name)} 
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition cursor-pointer ${
                isActive 
                  ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30 font-bold shadow-sm' 
                  : 'text-gray-300 hover:text-[#39FF14] border-transparent hover:bg-[#39FF14]/5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#39FF14]' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-6 mt-auto border-t border-gray-800/50 space-y-3">
        <button 
          onClick={() => setActiveTab('Campeonatos')} 
          className="w-full bg-[#39FF14] text-black font-black py-3 rounded-xl hover:brightness-110 transition-all text-xs tracking-wider cursor-pointer shadow-lg"
        >
          + GERENCIAR TORNEIOS
        </button>
        <div className="text-center text-[10px] text-gray-500 pt-1">
          Criado por <span className="text-[#39FF14] font-bold">MAGNO THIAGO CYBER GHOST</span>
        </div>
      </div>
    </aside>
    </>
  );
}

