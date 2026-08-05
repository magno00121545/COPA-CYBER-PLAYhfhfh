import { useState, useEffect } from 'react';
import { ExternalLink, Download, Share2 } from 'lucide-react';
import { generateSocialMediaPDF } from '../lib/pdfExport';
import { supabase } from '../lib/supabase';

export default function DashboardView() {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTournamentsCount, setActiveTournamentsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [avgGoals, setAvgGoals] = useState('0.00');
  const [totalMatchesCount, setTotalMatchesCount] = useState(0);

  useEffect(() => {
    loadDashboardStats();

    const handleRealtimeChange = () => {
      loadDashboardStats();
    };

    window.addEventListener('cyberplay_realtime_change', handleRealtimeChange);
    return () => {
      window.removeEventListener('cyberplay_realtime_change', handleRealtimeChange);
    };
  }, []);

  async function loadDashboardStats() {
    try {
      // 1. Tournaments
      const { data: tData } = await supabase.from('tournaments').select('*');
      const tournaments = tData || [];
      const active = tournaments.filter(t => t.status !== 'Finalizado');
      setActiveTournamentsCount(active.length);

      // 2. Financial records
      const { data: fData } = await supabase.from('financial_records').select('*');
      const records = fData || [];
      const incomeSum = records
        .filter(r => r.type === 'income')
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      setTotalRevenue(incomeSum);

      // 3. Players & Registrations
      const { data: pData } = await supabase.from('players').select('*');
      const players = pData || [];
      setParticipantsCount(players.length);

      // 4. Matches & Average Goals
      const { data: mData } = await supabase.from('matches').select('*');
      const matches = mData || [];
      const finishedMatches = matches.filter(m => m.status === 'Finalizado');
      setTotalMatchesCount(finishedMatches.length);

      if (finishedMatches.length > 0) {
        const totalGoals = finishedMatches.reduce((acc, m) => {
          const s1 = Number(m.score1) || 0;
          const s2 = Number(m.score2) || 0;
          return acc + s1 + s2;
        }, 0);
        setAvgGoals((totalGoals / finishedMatches.length).toFixed(2));
      } else {
        setAvgGoals('0.00');
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }

  const openPublicSite = () => {
    window.open(window.location.origin + '?public=true', '_blank');
  };

  async function handleGeneratePdf() {
    try {
      setGeneratingPdf(true);
      await generateSocialMediaPDF();
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar o PDF');
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Campeonatos Ativos */}
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Campeonatos Ativos</p>
          <h3 className="text-3xl font-black text-white">{activeTournamentsCount}</h3>
          <div className="mt-2 text-[10px] text-[#39FF14] font-medium">
            {activeTournamentsCount === 0 ? 'Nenhum campeonato em andamento' : `${activeTournamentsCount} em andamento`}
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Receita Total</p>
          <h3 className="text-3xl font-black text-[#39FF14]">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="mt-2 text-[10px] text-gray-400 font-medium">
            {totalRevenue === 0 ? 'Sem inscrições financeiras' : 'Total em caixa'}
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Participantes</p>
          <h3 className="text-3xl font-black text-white">{participantsCount}</h3>
          <div className="mt-2 text-[10px] text-blue-400 font-medium">
            {participantsCount === 0 ? 'Nenhum jogador cadastrado' : `${participantsCount} jogadores cadastrados`}
          </div>
        </div>

        {/* Média de Gols */}
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Média de Gols</p>
          <h3 className="text-3xl font-black text-white">{avgGoals}</h3>
          <div className="mt-2 text-[10px] text-gray-400 font-medium">
            {totalMatchesCount === 0 ? 'Nenhuma partida finalizada' : `Em ${totalMatchesCount} partidas realizadas`}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-[#111] p-6 rounded-2xl border border-[#39FF14]/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#39FF14]/10 text-[#39FF14] rounded-xl border border-[#39FF14]/20">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">PDF Oficial para Redes Sociais</h4>
              <p className="text-xs text-gray-400">Gere um arquivo PDF formatado com a tabela de classificação e os chaveamentos prontos para publicação no Instagram, WhatsApp ou Discord.</p>
            </div>
          </div>
          <button
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
            className="w-full bg-[#39FF14] text-black font-black p-3.5 rounded-xl hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{generatingPdf ? 'Gerando Documento PDF...' : 'GERAR PDF DE CLASSIFICAÇÃO & CHAVEAMENTO'}</span>
          </button>
        </div>

        <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 text-white rounded-xl border border-gray-700">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Portal dos Participantes</h4>
              <p className="text-xs text-gray-400">Abra a página pública onde os jogadores realizam as inscrições via PIX e acompanham a tabela de classificação em tempo real.</p>
            </div>
          </div>
          <button
            onClick={openPublicSite}
            className="w-full bg-white text-black font-bold p-3.5 rounded-xl hover:bg-gray-200 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>ABRIR PORTAL PÚBLICO DOS PARTICIPANTES</span>
          </button>
        </div>
      </div>
    </div>
  );
}
