import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Player } from '../lib/types';
import { Users, Search, UserPlus, CheckCircle2, Trash2, Edit, RefreshCw } from 'lucide-react';

export default function PlayersView() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nickname: '', platform: '', name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    setLoading(true);
    try {
      // 1. Fetch existing players from 'players' table
      const { data: pData, error: pErr } = await supabase.from('players').select('*');
      if (pErr) console.error('Error fetching players:', pErr);

      // 2. Fetch registrations to guarantee all participant nicknames are present
      const { data: regData } = await supabase.from('tournament_registrations').select('*');

      const existingMap = new Map<string, Player>();
      (pData || []).forEach((p: Player) => {
        if (p.nickname) existingMap.set(p.nickname.toLowerCase(), p);
      });

      // Automatically sync any registered participant into 'players' state if missing
      const mergedList: Player[] = [...(pData || [])];

      if (regData && regData.length > 0) {
        for (const reg of regData) {
          if (reg.nickname && !existingMap.has(reg.nickname.toLowerCase())) {
            const tempPlayer: Player = {
              id: reg.id || ('reg_' + Math.random().toString(36).substr(2, 9)),
              nickname: reg.nickname,
              platform: reg.platform || 'Geral',
              phone: reg.phone || '',
              status: reg.status === 'Confirmado' ? 'Confirmado' : 'Aguardando',
            };
            mergedList.push(tempPlayer);
            existingMap.set(reg.nickname.toLowerCase(), tempPlayer);

            // Save to players table in background for persistence
            await supabase.from('players').insert([{
              nickname: reg.nickname,
              platform: reg.platform || 'Geral',
              phone: reg.phone || '',
              status: reg.status === 'Confirmado' ? 'Confirmado' : 'Aguardando'
            }]);
          }
        }
      }

      setPlayers(mergedList);
    } catch (err) {
      console.error('Error in fetchPlayers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formData.nickname.trim()) return;

    setLoading(true);
    const data = {
      nickname: formData.nickname.trim(),
      platform: formData.platform.trim() || 'Geral',
      name: formData.name.trim() || '',
      phone: formData.phone.trim() || '',
      status: 'Confirmado' as const
    };

    let error;
    if (editingPlayer) {
      ({ error } = await supabase.from('players').update(data).eq('id', editingPlayer.id));
    } else {
      ({ error } = await supabase.from('players').insert([data]));
    }

    if (error) {
      console.error('Error saving player:', error);
      alert('Erro ao salvar jogador: ' + (error.message || String(error)));
    } else {
      setFormData({ nickname: '', platform: '', name: '', phone: '' });
      setEditingPlayer(null);
      setShowForm(false);
      fetchPlayers();
    }
    setLoading(false);
  }

  async function deletePlayer(id: string) {
    if (!confirm('Tem certeza que deseja excluir este jogador?')) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) console.error('Error deleting player:', error);
    else fetchPlayers();
  }

  async function approvePlayer(p: Player) {
    const { error } = await supabase.from('players').update({ status: 'Confirmado' }).eq('id', p.id);
    if (error) console.error('Error approving player:', error);
    else fetchPlayers();
  }

  function startEdit(p: Player) {
    setEditingPlayer(p);
    setFormData({
      nickname: p.nickname || '',
      platform: p.platform || '',
      name: p.name || '',
      phone: p.phone || ''
    });
    setShowForm(true);
  }

  function handleCancelForm() {
    setEditingPlayer(null);
    setFormData({ nickname: '', platform: '', name: '', phone: '' });
    setShowForm(false);
  }

  const filteredPlayers = players.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.nickname?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.platform?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111] p-5 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#39FF14]" /> Lista de Jogadores Cadastrados
          </h3>
          <p className="text-xs text-gray-400 mt-1">Gerencie os perfis, plataformas e confirmação dos participantes</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              if (showForm && !editingPlayer) handleCancelForm();
              else {
                setEditingPlayer(null);
                setFormData({ nickname: '', platform: '', name: '', phone: '' });
                setShowForm(true);
              }
            }}
            className="bg-[#39FF14] text-black font-black px-4 py-2.5 rounded-xl text-xs hover:brightness-110 transition cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showForm ? 'Fechar Formulário' : '+ Cadastrar Novo Jogador'}</span>
          </button>

          <button
            onClick={fetchPlayers}
            className="p-2.5 bg-[#161616] border border-gray-800 rounded-xl text-gray-400 hover:text-[#39FF14] transition cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Register / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-2xl border border-[#39FF14]/30 space-y-4 shadow-2xl">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h4 className="font-bold text-white text-base">
              {editingPlayer ? `Editar Jogador: ${editingPlayer.nickname}` : 'Cadastrar Novo Jogador'}
            </h4>
            <button type="button" onClick={handleCancelForm} className="text-xs text-gray-400 hover:text-white">
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Nickname / Gamertag *</label>
              <input
                type="text"
                required
                value={formData.nickname}
                onChange={(e) => setFormData(p => ({ ...p, nickname: e.target.value }))}
                placeholder="Ex: ProPlayer99"
                className="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Nome Completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Carlos Silva"
                className="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Plataforma</label>
              <input
                type="text"
                value={formData.platform}
                onChange={(e) => setFormData(p => ({ ...p, platform: e.target.value }))}
                placeholder="Ex: PS5, Xbox, PC"
                className="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-1 uppercase">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="Ex: (11) 99999-8888"
                className="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#39FF14] text-black font-black rounded-xl text-xs hover:brightness-110 shadow-md disabled:opacity-50"
            >
              {loading ? 'Salvando...' : (editingPlayer ? 'Salvar Alterações' : 'Cadastrar Jogador')}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Pesquisar por Nickname, Nome, Telefone ou Plataforma..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111] border border-gray-800 pl-10 pr-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
        />
      </div>

      {/* Table Container */}
      <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#050505] text-gray-400 font-black text-xs uppercase border-b border-gray-800 tracking-wider">
              <tr>
                <th className="p-4">NICKNAME</th>
                <th className="p-4">NOME COMPLETO</th>
                <th className="p-4">PLATAFORMA</th>
                <th className="p-4">TELEFONE / WHATSAPP</th>
                <th className="p-4 text-center">STATUS</th>
                <th className="p-4 text-right pr-6">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredPlayers.map((p) => (
                <tr key={p.id} className="hover:bg-[#161616] transition">
                  <td className="p-4 font-bold text-white text-base">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center font-bold text-[#39FF14] text-xs uppercase">
                        {(p.nickname || 'J')[0]}
                      </div>
                      <span>{p.nickname}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{p.name || '—'}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{p.platform || 'Geral'}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{p.phone || '—'}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      p.status === 'Confirmado' 
                        ? 'bg-green-950 text-green-300 border-green-800' 
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {p.status || 'Confirmado'}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {p.status !== 'Confirmado' && (
                        <button
                          onClick={() => approvePlayer(p)}
                          className="p-1.5 text-xs text-[#39FF14] hover:bg-[#39FF14]/10 rounded-lg flex items-center gap-1 font-bold"
                          title="Confirmar participante"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Aprovar
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 text-xs text-blue-400 hover:bg-blue-950/30 rounded-lg flex items-center gap-1 font-bold"
                        title="Editar jogador"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePlayer(p.id)}
                        className="p-1.5 text-xs text-red-400 hover:bg-red-950/30 rounded-lg flex items-center gap-1 font-bold"
                        title="Excluir jogador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                    {loading ? 'Carregando lista de jogadores...' : 'Nenhum jogador encontrado.'}
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
