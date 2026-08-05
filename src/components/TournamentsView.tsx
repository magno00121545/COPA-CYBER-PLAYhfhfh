import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../lib/types';

export default function TournamentsView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [name, setName] = useState('');
  const [maxSpots, setMaxSpots] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    const { data, error } = await supabase.from('tournaments').select('*');
    if (error) console.error('Error fetching tournaments:', error);
    else setTournaments(data || []);
  }

  async function addTournament(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    const { error } = await supabase.from('tournaments').insert([{ 
      name, 
      status: 'Inscrições abertas',
      max_spots: parseInt(maxSpots),
      current_spots: 0,
      payment_info: paymentInfo
    }]);
    if (error) console.error('Error adding tournament:', error);
    else {
      setName('');
      setMaxSpots('');
      setPaymentInfo('');
      fetchTournaments();
    }
    setLoading(false);
  }

  async function deleteTournament(id: string) {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) console.error('Error deleting tournament:', error);
    else fetchTournaments();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addTournament} className="bg-[#111] p-6 rounded-xl border border-gray-800 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do campeonato"
          className="md:col-span-1 bg-black border border-gray-700 p-3 rounded-lg text-white"
        />
        <input
          type="number"
          value={maxSpots}
          onChange={(e) => setMaxSpots(e.target.value)}
          placeholder="Max Vagas"
          className="bg-black border border-gray-700 p-3 rounded-lg text-white"
        />
        <input
          type="text"
          value={paymentInfo}
          onChange={(e) => setPaymentInfo(e.target.value)}
          placeholder="Formas de Pagamento"
          className="md:col-span-1 bg-black border border-gray-700 p-3 rounded-lg text-white"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#39FF14] text-black font-bold py-3 px-6 rounded-lg hover:brightness-110 disabled:opacity-50"
        >
          {loading ? '...' : 'Criar'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => (
          <div key={t.id} className="bg-[#111] p-6 rounded-xl border border-gray-800 hover:border-[#39FF14]/50 transition-all">
            <h4 className="font-black text-lg mb-2">{t.name}</h4>
            <p className="text-gray-400 text-sm mb-4">{t.status}</p>
            <div className="flex gap-2">
              <button onClick={() => deleteTournament(t.id)} className="flex-1 bg-red-900 text-white py-2 rounded text-xs font-bold hover:bg-red-800">EXCLUIR</button>
              <button className="flex-1 bg-[#39FF14]/10 text-[#39FF14] py-2 rounded text-xs font-bold border border-[#39FF14]/20 hover:bg-[#39FF14]/20">GERIR</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
