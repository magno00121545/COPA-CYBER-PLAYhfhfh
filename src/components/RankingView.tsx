import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Ranking, Match, Player, Penalty, Category } from '../lib/types';
import { Trophy, Swords, Plus, Trash2, ShieldAlert, Calendar, Clock, Edit3, CheckCircle2, User, Award, AlertTriangle, Gamepad2 } from 'lucide-react';
import { fetchCategories } from '../lib/categories';

interface RankingWithPlayer extends Ranking {
  players?: { nickname: string };
  nickname?: string;
}

export default function RankingView() {
  const [rankings, setRankings] = useState<RankingWithPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('eFootball');

  // Match form states

  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  
  const [matchCategory, setMatchCategory] = useState('Futebol');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [winner, setWinner] = useState<string>('auto'); // 'auto', nickname, or 'Empate'
  const [loser, setLoser] = useState<string>('auto');
  const [matchDate, setMatchDate] = useState<string>('');
  const [matchTime, setMatchTime] = useState<string>('');
  const [phase, setPhase] = useState<string>('Rodada de Grupos');
  const [punishment, setPunishment] = useState<string>('');
  const [matchStatus, setMatchStatus] = useState<'Agendado' | 'Em Andamento' | 'Concluído'>('Agendado');
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // Penalty form states
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [penaltyPlayer, setPenaltyPlayer] = useState('');
  const [penaltyCategory, setPenaltyCategory] = useState('Futebol');
  const [penaltyDeduction, setPenaltyDeduction] = useState<number>(1);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [submittingPenalty, setSubmittingPenalty] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // 0. Fetch Categories
    const cats = await fetchCategories();
    setAvailableCategories(cats);

    // 1. Fetch rankings
    const { data: rData } = await supabase.from('rankings').select('*, players(nickname)');
    
    // 2. Fetch matches
    const { data: mData } = await supabase.from('matches').select('*');

    // 3. Fetch penalties
    const { data: pnlData } = await supabase.from('penalties').select('*');

    // 4. Fetch players list for dropdowns
    const { data: pData } = await supabase.from('players').select('*');
    const { data: regData } = await supabase.from('tournament_registrations').select('*');

    const combinedPlayersMap = new Map<string, Player>();
    (pData || []).forEach((p: Player) => {
      if (p.nickname) combinedPlayersMap.set(p.nickname, p);
    });
    (regData || []).forEach((r: any) => {
      if (r.nickname && !combinedPlayersMap.has(r.nickname)) {
        combinedPlayersMap.set(r.nickname, {
          id: r.id,
          nickname: r.nickname,
          platform: r.platform || 'Geral',
          status: 'Confirmado'
        });
      }
    });

    setPlayersList(Array.from(combinedPlayersMap.values()));
    setRankings((rData as any) || []);
    setMatches(mData || []);
    setPenalties((pnlData as any) || []);
  }

  // Filter rankings by category
  const filteredRankings = rankings.filter(r => {
    if (selectedCategory === 'Geral' || selectedCategory === 'Todos') return true;
    const cat = r.game_category || 'Futebol';
    if (selectedCategory === 'Futebol') {
      return cat === 'Futebol' || cat === 'eFootball' || cat.includes('EA FC') || cat.includes('FIFA');
    }
    return cat.toLowerCase() === selectedCategory.toLowerCase() || cat.includes(selectedCategory);
  });

  const sortedRankings = [...filteredRankings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const sgB = (b.goals_for || 0) - (b.goals_against || 0);
    const sgA = (a.goals_for || 0) - (a.goals_against || 0);
    if (sgB !== sgA) return sgB - sgA;
    return (b.wins || 0) - (a.wins || 0);
  });

  // Filter matches by category
  const filteredMatches = matches.filter(m => {
    if (selectedCategory === 'Geral' || selectedCategory === 'Todos') return true;
    const cat = m.game_category || 'Futebol';
    if (selectedCategory === 'Futebol') {
      return cat === 'Futebol' || cat === 'eFootball' || cat.includes('EA FC') || cat.includes('FIFA');
    }
    return cat.toLowerCase() === selectedCategory.toLowerCase() || cat.includes(selectedCategory);
  });


  function startEditMatch(m: Match) {
    setEditingMatch(m);
    setMatchCategory(m.game_category || 'Futebol');
    setPlayer1(m.player1);
    setPlayer2(m.player2);
    setScore1(m.score1 || 0);
    setScore2(m.score2 || 0);
    setWinner(m.winner || 'auto');
    setLoser(m.loser || 'auto');
    setMatchDate(m.match_date || '');
    setMatchTime(m.match_time || '');
    setPhase(m.phase || 'Rodada de Grupos');
    setPunishment(m.punishment || '');
    setMatchStatus((m.status as any) || 'Agendado');
    setShowMatchForm(true);
  }

  function resetMatchForm() {
    setEditingMatch(null);
    setPlayer1('');
    setPlayer2('');
    setScore1(0);
    setScore2(0);
    setWinner('auto');
    setLoser('auto');
    setMatchDate('');
    setMatchTime('');
    setPhase('Rodada de Grupos');
    setPunishment('');
    setMatchStatus('Agendado');
    setShowMatchForm(false);
  }

  async function handleSaveMatch(e: FormEvent) {
    e.preventDefault();
    if (!player1 || !player2) {
      alert('Selecione os dois jogadores para a partida.');
      return;
    }
    if (player1 === player2) {
      alert('Selecione dois jogadores diferentes.');
      return;
    }

    setSubmittingMatch(true);

    // Determine actual winner & loser
    let finalWinner = winner;
    let finalLoser = loser;

    if (winner === 'auto') {
      if (score1 > score2) {
        finalWinner = player1;
        finalLoser = player2;
      } else if (score2 > score1) {
        finalWinner = player2;
        finalLoser = player1;
      } else {
        finalWinner = 'Empate';
        finalLoser = 'Empate';
      }
    } else if (winner === player1) {
      finalLoser = player2;
    } else if (winner === player2) {
      finalLoser = player1;
    }

    const matchPayload = {
      game_category: matchCategory,
      player1,
      player2,
      score1: Number(score1),
      score2: Number(score2),
      winner: finalWinner,
      loser: finalLoser,
      match_date: matchDate,
      match_time: matchTime,
      phase,
      punishment,
      status: matchStatus
    };

    let error = null;
    if (editingMatch) {
      const res = await supabase.from('matches').update(matchPayload).eq('id', editingMatch.id);
      error = res.error;
    } else {
      const res = await supabase.from('matches').insert([matchPayload]);
      error = res.error;
    }

    if (error) {
      console.error('Error saving match:', error);
      alert('Erro ao salvar partida: ' + (error.message || String(error)));
    } else {
      // Automatically update rankings if match is finished/completed
      if (matchStatus === 'Concluído' || matchStatus === 'Finalizado') {
        await updatePlayerRankingStats(matchCategory, player1, player2, Number(score1), Number(score2), finalWinner);
      }

      resetMatchForm();
      fetchData();
    }
    setSubmittingMatch(false);
  }

  async function updatePlayerRankingStats(category: string, p1Nick: string, p2Nick: string, s1: number, s2: number, matchWinner: string) {
    try {
      const updateSingle = async (nick: string, goalsScored: number, goalsConceded: number, isWinner: boolean, isDraw: boolean) => {
        const { data: existingData } = await supabase.from('rankings').select('*');
        const existingRow = (existingData || []).find((r: any) => {
          const matchCat = (r.game_category || 'Futebol') === category;
          const matchNick = r.nickname === nick || r.players?.nickname === nick;
          return matchCat && matchNick;
        });

        const winsAdd = isWinner ? 1 : 0;
        const drawsAdd = isDraw ? 1 : 0;
        const lossesAdd = (!isWinner && !isDraw) ? 1 : 0;
        const ptsAdd = isWinner ? 3 : (isDraw ? 1 : 0);

        if (existingRow) {
          const newWins = (existingRow.wins || 0) + winsAdd;
          const newDraws = (existingRow.draws || 0) + drawsAdd;
          const newLosses = (existingRow.losses || 0) + lossesAdd;
          const newPoints = (existingRow.points || 0) + ptsAdd;
          const newPj = (existingRow.matches_played || 0) + 1;
          const newGf = (existingRow.goals_for || 0) + goalsScored;
          const newGa = (existingRow.goals_against || 0) + goalsConceded;

          await supabase.from('rankings').update({
            wins: newWins,
            draws: newDraws,
            losses: newLosses,
            points: newPoints,
            matches_played: newPj,
            goals_for: newGf,
            goals_against: newGa
          }).eq('id', existingRow.id);
        } else {
          const p = playersList.find(pl => pl.nickname === nick);
          await supabase.from('rankings').insert([{
            player_id: p?.id || 'temp_' + Math.random().toString(36).substr(2, 6),
            game_category: category,
            position: 1,
            points: ptsAdd,
            wins: winsAdd,
            draws: drawsAdd,
            losses: lossesAdd,
            matches_played: 1,
            goals_for: goalsScored,
            goals_against: goalsConceded
          }]);
        }
      };

      const isDraw = matchWinner === 'Empate' || s1 === s2;
      const isP1Win = matchWinner === p1Nick || (!isDraw && s1 > s2);
      const isP2Win = matchWinner === p2Nick || (!isDraw && s2 > s1);

      await updateSingle(p1Nick, s1, s2, isP1Win, isDraw);
      await updateSingle(p2Nick, s2, s1, isP2Win, isDraw);
    } catch (err) {
      console.error('Error updating player stats:', err);
    }
  }

  async function handleApplyPenalty(e: FormEvent) {
    e.preventDefault();
    if (!penaltyPlayer) {
      alert('Selecione o jogador para aplicar a punição.');
      return;
    }
    setSubmittingPenalty(true);

    const penaltyPayload = {
      player_nickname: penaltyPlayer,
      game_category: penaltyCategory,
      points_deducted: Number(penaltyDeduction),
      reason: penaltyReason || 'Infração das regras do torneio'
    };

    const { error } = await supabase.from('penalties').insert([penaltyPayload]);
    if (error) {
      console.error('Error inserting penalty:', error);
      alert('Erro ao registrar punição: ' + (error.message || String(error)));
    } else {
      // Deduct points from ranking if row exists
      const { data: existingData } = await supabase.from('rankings').select('*');
      const existingRow = (existingData || []).find((r: any) => {
        const matchCat = (r.game_category || 'Futebol') === penaltyCategory;
        const matchNick = r.nickname === penaltyPlayer || r.players?.nickname === penaltyPlayer;
        return matchCat && matchNick;
      });

      if (existingRow) {
        const updatedPts = Math.max(0, (existingRow.points || 0) - Number(penaltyDeduction));
        await supabase.from('rankings').update({ points: updatedPts }).eq('id', existingRow.id);
      }

      setPenaltyPlayer('');
      setPenaltyReason('');
      setShowPenaltyForm(false);
      fetchData();
    }
    setSubmittingPenalty(false);
  }

  async function deleteMatch(id: string) {
    if (!confirm('Deseja excluir esta partida?')) return;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) console.error('Error deleting match:', error);
    else fetchData();
  }

  async function deletePenalty(id: string) {
    if (!confirm('Deseja excluir esta punição?')) return;
    const { error } = await supabase.from('penalties').delete().eq('id', id);
    if (error) console.error('Error deleting penalty:', error);
    else fetchData();
  }

  return (
    <div className="space-y-8">
      {/* SELETOR DE CATEGORIAS DE JOGOS */}
      <div className="bg-[#111] p-5 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-[#39FF14] uppercase tracking-widest">Modalidades & Categorias</span>
          <h3 className="text-xl font-black text-white">Tabelas de Pontuação por Jogo</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableCategories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-md scale-105'
                  : 'bg-[#050505] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
              }`}
            >
              <span>{cat.icon || '🎮'}</span>
              <span>{cat.name}</span>
            </button>
          ))}
          <button
            onClick={() => setSelectedCategory('Geral')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'Geral' || selectedCategory === 'Todos'
                ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-md scale-105'
                : 'bg-[#050505] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
            }`}
          >
            <span>🎮</span>
            <span>Geral (Todos)</span>
          </button>
        </div>

      </div>

      {/* GERENCIADOR DE PARTIDAS, HORÁRIOS, VENCEDORES E PUNIÇÕES */}
      <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-[#39FF14]" /> Painel Administrativo de Partidas & Agendamentos
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Agende confrontos (Dia, Horário e Fase), atualize o placar, defina o vencedor/perdedor e aplique punições
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPenaltyForm(!showPenaltyForm)}
              className="bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{showPenaltyForm ? 'Fechar Punição' : '+ Registrar Punição'}</span>
            </button>

            <button
              onClick={() => {
                if (showMatchForm) resetMatchForm();
                else setShowMatchForm(true);
              }}
              className="bg-[#39FF14] text-black font-black px-4 py-2 rounded-xl text-xs hover:brightness-110 transition cursor-pointer flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{showMatchForm ? 'Fechar Formulário' : '+ Agendar / Lançar Partida'}</span>
            </button>
          </div>
        </div>

        {/* Form de Aplicação de Punição */}
        {showPenaltyForm && (
          <form onSubmit={handleApplyPenalty} className="bg-gradient-to-r from-red-950/40 via-[#111] to-red-950/40 p-6 rounded-2xl border border-red-800/60 space-y-4 shadow-2xl">
            <h4 className="text-sm font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Registrar Punição / Advertência / WO a Jogador
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1 uppercase">Jogador Punido</label>
                <select
                  required
                  value={penaltyPlayer}
                  onChange={(e) => setPenaltyPlayer(e.target.value)}
                  className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="">Selecione o jogador...</option>
                  {playersList.map((p) => (
                    <option key={p.id} value={p.nickname}>{p.nickname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1 uppercase">Categoria do Jogo</label>
                <select
                  value={penaltyCategory}
                  onChange={(e) => setPenaltyCategory(e.target.value)}
                  className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.icon || '🎮'} {c.name}
                    </option>
                  ))}
                  <option value="Geral">🎮 Geral / Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1 uppercase">Desconto de Pontos (PTS)</label>
                <input
                  type="number"
                  min="0"
                  value={penaltyDeduction}
                  onChange={(e) => setPenaltyDeduction(Number(e.target.value))}
                  placeholder="Ex: 1 ou 3 pontos"
                  className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-red-400 font-bold text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1 uppercase">Motivo / Infração</label>
                <input
                  type="text"
                  required
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="Ex: W.O por atraso de 15 min, conduta antidesportiva"
                  className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPenaltyForm(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingPenalty}
                className="px-6 py-2.5 bg-red-600 text-white font-black rounded-xl text-xs hover:bg-red-500 shadow-lg"
              >
                {submittingPenalty ? 'Aplicando...' : 'Aplicar Punição e Descontar Pontos'}
              </button>
            </div>
          </form>
        )}

        {/* Form Agendar / Atualizar Resultado de Partida */}
        {showMatchForm && (
          <form onSubmit={handleSaveMatch} className="bg-[#050505] p-6 rounded-2xl border border-[#39FF14]/40 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h4 className="text-sm font-black text-[#39FF14] uppercase tracking-wider flex items-center gap-2">
                ⚡ {editingMatch ? 'Editar Partida & Resultado' : 'Novo Agendamento ou Lançamento de Resultado'}
              </h4>
              {editingMatch && (
                <button type="button" onClick={resetMatchForm} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-lg">
                  Cancelar Edição
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Categoria do Jogo *</label>
                <select
                  value={matchCategory}
                  onChange={(e) => setMatchCategory(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#39FF14]"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.icon || '🎮'} {c.name}
                    </option>
                  ))}
                  <option value="Outros">🎮 Outros Jogos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Fase / Rodada</label>
                <input
                  type="text"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  placeholder="Ex: Fase de Grupos, Oitavas, Semifinal, Final"
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#39FF14]" /> Dia da Partida
                </label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#39FF14]" /> Horário da Partida
                </label>
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Jogador 1 (Casa) *</label>
                <select
                  required
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#39FF14]"
                >
                  <option value="">Selecione Jogador 1...</option>
                  {playersList.map((p) => (
                    <option key={p.id} value={p.nickname}>{p.nickname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Jogador 2 (Visitante) *</label>
                <select
                  required
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#39FF14]"
                >
                  <option value="">Selecione Jogador 2...</option>
                  {playersList.map((p) => (
                    <option key={p.id} value={p.nickname}>{p.nickname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Placar J1 vs J2</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={score1}
                    onChange={(e) => setScore1(Number(e.target.value))}
                    className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs font-bold text-center focus:outline-none focus:border-[#39FF14]"
                  />
                  <span className="text-gray-500 font-black">x</span>
                  <input
                    type="number"
                    min="0"
                    value={score2}
                    onChange={(e) => setScore2(Number(e.target.value))}
                    className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs font-bold text-center focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Status da Partida</label>
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value as any)}
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-[#39FF14]"
                >
                  <option value="Agendado">📅 Agendado (Aguardando)</option>
                  <option value="Em Andamento">🎮 Em Andamento (Ao Vivo)</option>
                  <option value="Concluído">✅ Concluído (Atualiza Ranking)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Quem Ganhou a Partida?</label>
                <select
                  value={winner}
                  onChange={(e) => setWinner(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-[#39FF14] font-bold text-xs focus:outline-none focus:border-[#39FF14]"
                >
                  <option value="auto">⚡ Automático pelo placar ({score1 > score2 ? player1 || 'J1' : (score2 > score1 ? player2 || 'J2' : 'Empate')})</option>
                  {player1 && <option value={player1}>🏆 Vencedor: {player1}</option>}
                  {player2 && <option value={player2}>🏆 Vencedor: {player2}</option>}
                  <option value="Empate">🤝 Empate / Sem Vencedor</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Observação / Punição na Partida</label>
                <input
                  type="text"
                  value={punishment}
                  onChange={(e) => setPunishment(e.target.value)}
                  placeholder="Ex: Advertência por atraso de 10 min, vitória por W.O"
                  className="w-full bg-[#111] border border-gray-700 p-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#39FF14]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={resetMatchForm}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingMatch}
                className="px-6 py-2.5 bg-[#39FF14] text-black font-black rounded-xl text-xs hover:brightness-110 shadow-lg"
              >
                {submittingMatch ? 'Salvando...' : (editingMatch ? 'SALVAR ALTERAÇÕES DA PARTIDA' : 'CADASTRAR E ATUALIZAR RANKING')}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Punições Registradas */}
        {penalties.length > 0 && (
          <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Histórico de Punições Ativas ({penalties.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {penalties.map((p, idx) => (
                <div key={p.id || idx} className="bg-[#050505] p-3 rounded-lg border border-red-900/40 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-white">{p.player_nickname}</span>
                    <span className="text-[10px] text-red-400 block font-mono">-{p.points_deducted} PTS ({p.game_category})</span>
                    <p className="text-[11px] text-gray-400 mt-1">{p.reason}</p>
                  </div>
                  <button
                    onClick={() => deletePenalty(p.id)}
                    className="text-gray-500 hover:text-red-400 transition"
                    title="Remover punição"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Partidas com Dia, Horário, Fase, Vencedor e Botão de Editar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m, index) => (
            <div key={m.id || index} className="p-5 bg-[#050505] border border-gray-800 rounded-2xl space-y-3 relative hover:border-gray-700 transition shadow-md">
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold border-b border-gray-800/80 pb-2">
                <span className="text-[#39FF14]">{m.game_category || 'Geral'} • {m.phase || 'Rodada'}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    m.status === 'Concluído'
                      ? 'bg-green-950 text-green-300 border-green-800'
                      : m.status === 'Em Andamento'
                      ? 'bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse'
                      : 'bg-gray-900 text-gray-300 border-gray-700'
                  }`}>
                    {m.status || 'Agendado'}
                  </span>
                </div>
              </div>

              {(m.match_date || m.match_time) && (
                <div className="flex items-center gap-4 text-xs text-gray-300 font-mono bg-[#111] px-3 py-1.5 rounded-lg border border-gray-800">
                  {m.match_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#39FF14]" /> {m.match_date}</span>}
                  {m.match_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#39FF14]" /> {m.match_time}</span>}
                </div>
              )}

              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${m.winner === m.player1 ? 'text-[#39FF14]' : 'text-gray-500'}`} />
                  <span className={`font-bold text-base ${m.winner === m.player1 ? 'text-[#39FF14]' : 'text-white'}`}>
                    {m.player1}
                  </span>
                </div>

                <div className="px-4 py-2 bg-[#111] border border-gray-800 rounded-xl font-mono text-lg font-black text-[#39FF14]">
                  {m.score1} x {m.score2}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`font-bold text-base ${m.winner === m.player2 ? 'text-[#39FF14]' : 'text-white'}`}>
                    {m.player2}
                  </span>
                  <User className={`w-4 h-4 ${m.winner === m.player2 ? 'text-[#39FF14]' : 'text-gray-500'}`} />
                </div>
              </div>

              {m.winner && m.winner !== 'Empate' && (
                <div className="pt-2 border-t border-gray-800/60 flex justify-between items-center text-xs">
                  <span className="text-[#39FF14] font-black flex items-center gap-1">
                    🏆 Vencedor: {m.winner}
                  </span>
                  {m.loser && m.loser !== 'Empate' && (
                    <span className="text-gray-500">Perdedor: {m.loser}</span>
                  )}
                </div>
              )}

              {m.winner === 'Empate' && (
                <div className="pt-2 border-t border-gray-800/60 text-xs text-gray-400 font-bold">
                  🤝 Resultado: Empate
                </div>
              )}

              {m.punishment && (
                <div className="text-[11px] text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/40">
                  ⚠️ Punição/Observação: {m.punishment}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-800/60">
                <button
                  onClick={() => startEditMatch(m)}
                  className="px-3 py-1 bg-[#39FF14]/10 text-[#39FF14] hover:bg-[#39FF14]/20 rounded-lg text-xs font-bold border border-[#39FF14]/30 transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar / Atualizar
                </button>
                <button
                  onClick={() => deleteMatch(m.id)}
                  className="p-1 bg-red-950/40 text-red-400 hover:bg-red-900 rounded-lg text-xs border border-red-800/40 transition cursor-pointer"
                  title="Excluir confronto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredMatches.length === 0 && (
            <div className="col-span-2 p-8 bg-[#050505] border border-gray-800 rounded-2xl text-center text-gray-500 text-xs italic">
              Nenhuma partida cadastrada para esta categoria ainda.
            </div>
          )}
        </div>
      </div>

      {/* TABELA DE CLASSIFICAÇÃO / RANKING DA CATEGORIA */}
      <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#39FF14]" /> Tabela de Classificação — {selectedCategory}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Estatísticas detalhadas organizadas por pontuação e saldo do jogo</p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#050505] px-3 py-1.5 rounded-lg border border-gray-800">
            Total: {sortedRankings.length} participantes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#050505] text-gray-400 font-black text-xs uppercase border-b border-gray-800 tracking-wider">
              <tr>
                <th className="p-4 w-16 text-center">POS</th>
                <th className="p-4">JOGADOR</th>
                <th className="p-4 text-center">PJ</th>
                <th className="p-4 text-center text-green-400">V</th>
                <th className="p-4 text-center text-gray-400">E</th>
                <th className="p-4 text-center text-red-400">D</th>
                
                {selectedCategory === 'Futebol' ? (
                  <>
                    <th className="p-4 text-center text-blue-400">GP</th>
                    <th className="p-4 text-center text-amber-400">GC</th>
                    <th className="p-4 text-center text-[#39FF14]">SG</th>
                  </>
                ) : (
                  <th className="p-4 text-center">APROVEITAMENTO</th>
                )}

                <th className="p-4 text-right pr-6">PONTOS (PTS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {sortedRankings.map((r, index) => {
                const pos = index + 1;
                const wins = r.wins || 0;
                const losses = r.losses || 0;
                const draws = r.draws || 0;
                const pj = r.matches_played || (wins + losses + draws) || 0;
                const winRate = pj > 0 ? Math.round((wins / pj) * 100) : 0;
                const gf = r.goals_for || 0;
                const ga = r.goals_against || 0;
                const sg = gf - ga;

                const name = r.nickname || r.players?.nickname || 'Jogador';

                return (
                  <tr key={r.id || index} className="hover:bg-[#161616] transition">
                    <td className="p-4 text-center font-black text-[#39FF14]">
                      {pos <= 3 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[#39FF14]/10 text-[#39FF14] text-xs font-black border border-[#39FF14]/30">
                          #{pos}
                        </span>
                      ) : (
                        `#${pos}`
                      )}
                    </td>
                    <td className="p-4 font-bold text-white text-base">
                      {name}
                    </td>
                    <td className="p-4 text-center font-bold text-gray-300">{pj}</td>
                    <td className="p-4 text-center font-bold text-green-400 bg-green-950/20">{wins}</td>
                    <td className="p-4 text-center font-bold text-gray-400">{draws}</td>
                    <td className="p-4 text-center font-bold text-red-400 bg-red-950/20">{losses}</td>
                    
                    {selectedCategory === 'Futebol' ? (
                      <>
                        <td className="p-4 text-center font-bold text-blue-400">{gf}</td>
                        <td className="p-4 text-center font-bold text-amber-400">{ga}</td>
                        <td className="p-4 text-center font-black text-[#39FF14]">{sg > 0 ? `+${sg}` : sg}</td>
                      </>
                    ) : (
                      <td className="p-4 text-center font-mono text-xs text-gray-300 font-bold">{winRate}%</td>
                    )}

                    <td className="p-4 text-right pr-6 font-black text-[#39FF14] font-mono text-base">
                      {r.points} <span className="text-xs text-gray-500 font-normal">PTS</span>
                    </td>
                  </tr>
                );
              })}
              {sortedRankings.length === 0 && (
                <tr>
                  <td colSpan={selectedCategory === 'Futebol' ? 10 : 8} className="p-8 text-center text-gray-500 italic">
                    Nenhum jogador classificado nesta categoria ainda.
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

