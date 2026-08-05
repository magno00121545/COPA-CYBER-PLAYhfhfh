import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TournamentRegistration, Tournament } from '../lib/types';
import { CheckCircle2, XCircle, Trash2, Search, Filter, UserCheck, ShieldAlert, RefreshCw, Clock, BellRing, Radio, MessageCircle } from 'lucide-react';
import { playNewRegistrationSound } from '../lib/audioNotification';

export default function RegistrationsView() {
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [tournamentsMap, setTournamentsMap] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'Todas' | 'Pendente' | 'Confirmado' | 'Recusado'>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  useEffect(() => {
    fetchData();

    // 1. Supabase Realtime Channel for live updates
    const channel = supabase
      .channel('registrations-realtime-view')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_registrations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nickname = payload.new?.nickname || 'Novo Participante';
            playNewRegistrationSound();
            setLiveAlert(`🔔 NOVA INSCRIÇÃO RECEBIDA AGORA: "${nickname}"!`);
            setTimeout(() => setLiveAlert(null), 10000);
          }
          fetchData();
        }
      )
      .subscribe((status) => {
        setIsLiveConnected(status === 'SUBSCRIBED');
      });

    // 2. Continuous 3-second polling for 100% real-time reliability
    const interval = setInterval(fetchData, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch registrations
    const { data: regData, error: regError } = await supabase
      .from('tournament_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch tournaments for name lookup
    const { data: tourData } = await supabase.from('tournaments').select('id, name');

    if (regError) {
      console.error('Error fetching registrations:', regError);
    } else {
      setRegistrations(regData || []);
    }

    if (tourData) {
      const tMap: Record<string, string> = {};
      tourData.forEach((t: Tournament) => {
        tMap[t.id] = t.name;
      });
      setTournamentsMap(tMap);
    }

    setLoading(false);
  }

  async function confirmRegistration(reg: TournamentRegistration) {
    setActionLoading(reg.id);
    try {
      // 1. Update registration status
      const { error: updateErr } = await supabase
        .from('tournament_registrations')
        .update({ status: 'Confirmado' })
        .eq('id', reg.id);

      if (updateErr) throw updateErr;

      // 2. Check if player exists in 'players' table, if not add them
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('nickname', reg.nickname);

      let playerId: string | null = null;
      if (existingPlayers && existingPlayers.length > 0) {
        playerId = existingPlayers[0].id;
        // Update status to Confirmado if needed
        await supabase.from('players').update({ status: 'Confirmado' }).eq('id', playerId);
      } else {
        const { data: newPlayer, error: newPlayerErr } = await supabase
          .from('players')
          .insert([{ nickname: reg.nickname, platform: reg.platform || 'Não informada', status: 'Confirmado' }])
          .select('id')
          .single();

        if (!newPlayerErr && newPlayer) {
          playerId = newPlayer.id;
        }
      }

      // 3. Add to rankings if player ID exists and not in ranking yet
      if (playerId) {
        const { data: existingRanking } = await supabase
          .from('rankings')
          .select('id')
          .eq('player_id', playerId);

        if (!existingRanking || existingRanking.length === 0) {
          const { data: allRankings } = await supabase.from('rankings').select('position');
          const nextPos = (allRankings?.length || 0) + 1;
          await supabase.from('rankings').insert([{
            player_id: playerId,
            position: nextPos,
            points: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            matches_played: 0
          }]);
        }
      }

      // 4. Increment current_spots in tournament if applicable
      if (reg.tournament_id) {
        const { data: tournament } = await supabase
          .from('tournaments')
          .select('current_spots')
          .eq('id', reg.tournament_id)
          .single();

        if (tournament) {
          await supabase
            .from('tournaments')
            .update({ current_spots: (tournament.current_spots || 0) + 1 })
            .eq('id', reg.tournament_id);
        }
      }

      await fetchData();
    } catch (err) {
      console.error('Error confirming registration:', err);
      alert('Erro ao confirmar inscrição.');
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectRegistration(id: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from('tournament_registrations')
      .update({ status: 'Recusado' })
      .eq('id', id);

    if (error) console.error('Error rejecting registration:', error);
    await fetchData();
    setActionLoading(null);
  }

  async function deleteRegistration(id: string) {
    if (!confirm('Deseja realmente remover o registro desta inscrição?')) return;
    setActionLoading(id);
    const { error } = await supabase.from('tournament_registrations').delete().eq('id', id);
    if (error) console.error('Error deleting registration:', error);
    await fetchData();
    setActionLoading(null);
  }

  const pendingCount = registrations.filter(r => r.status === 'Pendente').length;
  const confirmedCount = registrations.filter(r => r.status === 'Confirmado').length;
  const rejectedCount = registrations.filter(r => r.status === 'Recusado').length;

  const filteredRegistrations = registrations.filter(r => {
    const matchesFilter = filter === 'Todas' || r.status === filter;
    const matchesSearch = r.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.platform && r.platform.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Realtime Notification Banner */}
      {liveAlert && (
        <div className="p-4 bg-[#39FF14] text-black rounded-2xl flex items-center justify-between font-black text-sm shadow-[0_0_20px_rgba(57,255,20,0.4)] animate-bounce border-2 border-black">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 animate-pulse" />
            <span>{liveAlert}</span>
          </div>
          <button
            onClick={() => setLiveAlert(null)}
            className="text-xs bg-black text-[#39FF14] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-900"
          >
            DISPENSAR
          </button>
        </div>
      )}

      {/* Top Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#111] p-5 rounded-2xl border border-gray-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total de Inscrições</p>
            <span className="inline-flex items-center gap-1 text-[10px] bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping" />
              AO VIVO
            </span>
          </div>
          <h3 className="text-2xl font-black text-white mt-1">{registrations.length}</h3>
        </div>
        <div className="bg-[#111] p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pendentes (PIX)
          </p>
          <h3 className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</h3>
        </div>
        <div className="bg-[#111] p-5 rounded-2xl border border-green-500/30 bg-green-950/10">
          <p className="text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmadas
          </p>
          <h3 className="text-2xl font-black text-green-400 mt-1">{confirmedCount}</h3>
        </div>
        <div className="bg-[#111] p-5 rounded-2xl border border-red-500/30 bg-red-950/10">
          <p className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Recusadas
          </p>
          <h3 className="text-2xl font-black text-red-400 mt-1">{rejectedCount}</h3>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
        {/* Filter Controls Bar */}
        <div className="p-5 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0a0a]">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {(['Todas', 'Pendente', 'Confirmado', 'Recusado'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filter === tab
                    ? 'bg-[#39FF14] text-black shadow-md'
                    : 'bg-[#161616] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tab === 'Todas' ? 'Todas' : tab === 'Pendente' ? 'Pendentes ⏳' : tab === 'Confirmado' ? 'Confirmadas ✅' : 'Recusadas ❌'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Nickname ou plataforma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050505] border border-gray-700 pl-9 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
              />
            </div>
            <button
              onClick={fetchData}
              title="Atualizar lista"
              className="p-2 bg-[#161616] border border-gray-800 rounded-xl text-gray-400 hover:text-[#39FF14] transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#050505] text-gray-400 font-black text-xs uppercase border-b border-gray-800 tracking-wider">
              <tr>
                <th className="p-4">DATA / HORA</th>
                <th className="p-4">NICKNAME DO JOGADOR</th>
                <th className="p-4">CAMPEONATO SELECIONADO</th>
                <th className="p-4">PLATAFORMA</th>
                <th className="p-4 text-center">STATUS PIX</th>
                <th className="p-4 text-right pr-6">AÇÕES ADMINISTRATIVAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredRegistrations.map((r) => {
                const tournamentName = r.tournament_id ? (tournamentsMap[r.tournament_id] || 'Torneio Principal') : 'Torneio Principal';
                const formattedDate = r.created_at
                  ? new Date(r.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                  : 'Recente';

                return (
                  <tr key={r.id} className="hover:bg-[#161616] transition">
                    <td className="p-4 font-mono text-xs text-gray-400 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center font-bold text-[#39FF14] text-xs">
                          {r.nickname[0]?.toUpperCase() || 'J'}
                        </div>
                        <span className="font-bold text-white text-base">{r.nickname}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-300">
                      {tournamentName}
                    </td>
                    <td className="p-4 text-gray-400 font-medium">
                      <span className="bg-[#050505] px-2.5 py-1 rounded-md border border-gray-800 text-xs">
                        {r.platform || 'Não informada'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {r.status === 'Confirmado' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-950 text-green-300 border border-green-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Confirmado
                        </span>
                      )}
                      {r.status === 'Pendente' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Aguardando PIX
                        </span>
                      )}
                      {r.status === 'Recusado' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800">
                          <XCircle className="w-3.5 h-3.5 text-red-400" /> Recusado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {r.status !== 'Confirmado' && (
                          <button
                            onClick={() => confirmRegistration(r)}
                            disabled={actionLoading === r.id}
                            className="bg-[#39FF14] text-black font-black px-3 py-1.5 rounded-lg text-xs hover:brightness-110 transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Aprovar pagamento PIX e inserir no ranking"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>
                        )}
                        {r.status === 'Pendente' && (
                          <button
                            onClick={() => rejectRegistration(r.id)}
                            disabled={actionLoading === r.id}
                            className="bg-red-950/60 text-red-400 border border-red-800 hover:bg-red-900 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                            title="Recusar inscrição"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Recusar</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteRegistration(r.id)}
                          disabled={actionLoading === r.id}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition cursor-pointer rounded-lg hover:bg-red-950/30"
                          title="Excluir inscrição"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                    {loading ? 'Carregando inscrições...' : 'Nenhuma inscrição encontrada.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

