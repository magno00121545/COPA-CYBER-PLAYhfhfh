import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ranking } from '../lib/types';
import { Trophy } from 'lucide-react';

interface RankingWithPlayer extends Ranking {
  players: { nickname: string };
}

export default function RankingView() {
  const [rankings, setRankings] = useState<RankingWithPlayer[]>([]);

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    const { data, error } = await supabase.from('rankings').select('*, players(nickname)');
    if (error) console.error('Error fetching rankings:', error);
    else setRankings((data as any) || []);
  }

  const sortedRankings = [...rankings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return (b.wins || 0) - (a.wins || 0);
  });

  return (
    <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#39FF14]" /> Tabela de Classificação Geral
          </h3>
          <p className="text-xs text-gray-400 mt-1">Gerencie a pontuação e estatísticas dos participantes</p>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-[#050505] px-3 py-1.5 rounded-lg border border-gray-800">
          Total: {rankings.length} jogadores
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#050505] text-gray-400 font-black text-xs uppercase border-b border-gray-800 tracking-wider">
            <tr>
              <th className="p-4 w-16 text-center">POS</th>
              <th className="p-4">JOGADOR</th>
              <th className="p-4 text-center">PJ</th>
              <th className="p-4 text-center text-green-400">VITÓRIAS (V)</th>
              <th className="p-4 text-center text-gray-400">EMPATES (E)</th>
              <th className="p-4 text-center text-red-400">DERROTAS (D)</th>
              <th className="p-4 text-center">APROVEITAMENTO</th>
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

              return (
                <tr key={r.id || index} className="hover:bg-[#161616] transition">
                  <td className="p-4 text-center font-black text-[#39FF14]">
                    {pos <= 3 ? (
                      <span className="px-2 py-0.5 rounded bg-[#39FF14]/10 text-[#39FF14] text-xs font-bold border border-[#39FF14]/30">
                        #{pos}
                      </span>
                    ) : (
                      `#${pos}`
                    )}
                  </td>
                  <td className="p-4 font-bold text-white">
                    {r.players?.nickname || 'Jogador sem nome'}
                  </td>
                  <td className="p-4 text-center font-bold text-gray-300">{pj}</td>
                  <td className="p-4 text-center font-bold text-green-400 bg-green-950/20">{wins}</td>
                  <td className="p-4 text-center font-bold text-gray-400">{draws}</td>
                  <td className="p-4 text-center font-bold text-red-400 bg-red-950/20">{losses}</td>
                  <td className="p-4 text-center">
                    <span className="font-mono text-xs text-gray-300 font-bold">{winRate}%</span>
                  </td>
                  <td className="p-4 text-right pr-6 font-black text-[#39FF14] font-mono text-base">
                    {r.points} <span className="text-xs text-gray-500 font-normal">PTS</span>
                  </td>
                </tr>
              );
            })}
            {sortedRankings.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500 italic">
                  Nenhum registro de ranking encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
