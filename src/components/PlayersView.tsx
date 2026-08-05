import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player } from '../lib/types';

export default function PlayersView() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase.from('players').select('*');
    if (error) console.error('Error fetching players:', error);
    else setPlayers(data || []);
  }

  async function approvePlayer(id: string) {
    const { error } = await supabase.from('players').update({ status: 'Confirmado' }).eq('id', id);
    if (error) console.error('Error approving player:', error);
    else fetchPlayers();
  }

  return (
    <div className="bg-[#111] rounded-xl border border-gray-800 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-900 text-gray-500 uppercase font-bold text-xs">
          <tr>
            <th className="p-4">Nickname</th>
            <th className="p-4">Status</th>
            <th className="p-4">Plataforma</th>
            <th className="p-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="border-t border-gray-800">
              <td className="p-4 font-bold">{p.nickname}</td>
              <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${p.status === 'Confirmado' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{p.status}</span></td>
              <td className="p-4 text-gray-400">{p.platform}</td>
              <td className="p-4 text-right">
                {p.status === 'Aguardando' && (
                  <button onClick={() => approvePlayer(p.id)} className="text-[#39FF14] text-xs font-bold hover:underline">Aprovar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
