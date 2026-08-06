import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament, Category } from '../lib/types';
import { Trophy, DollarSign, CreditCard, Gamepad2, Layers, Award, PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { fetchCategories } from '../lib/categories';

export default function TournamentsView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    maxSpots: '',
    entryFee: 'R$ 20,00',
    paymentMethods: 'PIX (Instantâneo), Dinheiro no Local, Cartão',
    paymentInfo: '',
    game: '',
    platform: '',
    prize_1st: '',
    prize_2nd: '',
    prize_3rd: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
    loadCats();
  }, []);

  async function loadCats() {
    const c = await fetchCategories();
    setCategories(c);
  }


  async function fetchTournaments() {
    const { data, error } = await supabase.from('tournaments').select('*');
    if (error) console.error('Error fetching tournaments:', error);
    else setTournaments(data || []);
  }

  async function saveTournament(e: FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setLoading(true);
    const feeText = formData.entryFee.trim() || 'R$ 20,00';
    const methodsText = formData.paymentMethods.trim() || 'PIX, Dinheiro, Cartão';
    const computedPaymentInfo = `${feeText} (${methodsText})`;

    const data = { 
      name: formData.name, 
      status: 'Inscrições abertas',
      max_spots: parseInt(formData.maxSpots) || 0,
      current_spots: editingTournament ? editingTournament.current_spots : 0,
      payment_info: computedPaymentInfo,
      entry_fee: feeText,
      payment_methods: methodsText,
      game: formData.game,
      platform: formData.platform,
      prize_1st: formData.prize_1st,
      prize_2nd: formData.prize_2nd,
      prize_3rd: formData.prize_3rd
    };
    
    let error;
    if (editingTournament) {
      ({ error } = await supabase.from('tournaments').update(data).eq('id', editingTournament.id));
    } else {
      ({ error } = await supabase.from('tournaments').insert([data]));
    }
    
    if (error) console.error('Error saving tournament:', error);
    else {
      setFormData({
        name: '',
        maxSpots: '',
        entryFee: 'R$ 20,00',
        paymentMethods: 'PIX (Instantâneo), Dinheiro no Local, Cartão',
        paymentInfo: '',
        game: '',
        platform: '',
        prize_1st: '',
        prize_2nd: '',
        prize_3rd: ''
      });
      setEditingTournament(null);
      fetchTournaments();
    }
    setLoading(false);
  }

  async function deleteTournament(id: string) {
    if (!confirm('Tem certeza que deseja excluir este campeonato?')) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) console.error('Error deleting tournament:', error);
    else fetchTournaments();
  }

  function startEdit(t: Tournament) {
    setEditingTournament(t);
    setFormData({
      name: t.name,
      maxSpots: t.max_spots.toString(),
      entryFee: t.entry_fee || 'R$ 20,00',
      paymentMethods: t.payment_methods || t.payment_info || 'PIX, Dinheiro, Cartão',
      paymentInfo: t.payment_info || '',
      game: t.game || '',
      platform: t.platform || '',
      prize_1st: t.prize_1st || '',
      prize_2nd: t.prize_2nd || '',
      prize_3rd: t.prize_3rd || ''
    });
  }

  function cancelEdit() {
    setEditingTournament(null);
    setFormData({
      name: '',
      maxSpots: '',
      entryFee: 'R$ 20,00',
      paymentMethods: 'PIX (Instantâneo), Dinheiro no Local, Cartão',
      paymentInfo: '',
      game: '',
      platform: '',
      prize_1st: '',
      prize_2nd: '',
      prize_3rd: ''
    });
  }

  return (
    <div className="space-y-8">
      {/* Formulário de Cadastro e Edição de Campeonato */}
      <div className="bg-[#111] p-6 sm:p-8 rounded-2xl border border-gray-800 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="text-[#39FF14] w-6 h-6" />
              {editingTournament ? 'Editar Campeonato' : 'Cadastrar Novo Campeonato'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Configure as informações do campeonato, valor da taxa de inscrição, formas de pagamento e premiação.
            </p>
          </div>
          {editingTournament && (
            <button
              onClick={cancelEdit}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-white font-bold px-3 py-1.5 rounded-lg"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={saveTournament} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Nome do Campeonato *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Torneio eFootball 2026 - Edição Master"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5 text-[#39FF14]" /> Jogo
              </label>
              <input
                type="text"
                value={formData.game}
                onChange={(e) => setFormData(p => ({ ...p, game: e.target.value }))}
                placeholder="Ex: eFootball 2026, EA FC 25, CS2, Mortal Kombat"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {categories.map((c) => {
                  const label = `${c.icon || '🎮'} ${c.name}`;
                  return (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, game: label }))}
                      className="text-[10px] bg-[#050505] hover:bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-800 transition flex items-center gap-1"
                    >
                      <span>{c.icon || '🎮'}</span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#39FF14]" /> Plataforma
              </label>
              <input
                type="text"
                value={formData.platform}
                onChange={(e) => setFormData(p => ({ ...p, platform: e.target.value }))}
                placeholder="Ex: PS5, PS4, Xbox, PC, Mobile"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Max Vagas de Jogadores
              </label>
              <input
                type="number"
                value={formData.maxSpots}
                onChange={(e) => setFormData(p => ({ ...p, maxSpots: e.target.value }))}
                placeholder="Ex: 16 ou 32 (0 para ilimitadas)"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>
          </div>

          {/* Destaque para VALOR DA TAXA e FORMAS DE PAGAMENTO */}
          <div className="p-5 bg-gradient-to-r from-[#161616] via-[#111] to-[#161616] border-2 border-[#39FF14]/40 rounded-2xl space-y-4">
            <h4 className="text-sm font-black text-[#39FF14] uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Configurações de Taxa e Pagamento da Inscrição
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">
                  💵 Valor da Taxa de Inscrição (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.entryFee}
                  onChange={(e) => setFormData(p => ({ ...p, entryFee: e.target.value }))}
                  placeholder="Ex: R$ 20,00 ou Gratuito"
                  className="w-full bg-[#050505] border border-gray-700 p-3.5 rounded-xl text-white text-base font-bold text-[#39FF14] focus:outline-none focus:border-[#39FF14]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Este valor será mostrado ao jogador antes de realizar o PIX.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">
                  💳 Formas de Pagamento Aceitas *
                </label>
                <input
                  type="text"
                  required
                  value={formData.paymentMethods}
                  onChange={(e) => setFormData(p => ({ ...p, paymentMethods: e.target.value }))}
                  placeholder="Ex: PIX, Dinheiro no Local, Cartão de Crédito/Débito"
                  className="w-full bg-[#050505] border border-gray-700 p-3.5 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-[#39FF14]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Especifique os métodos (ex: PIX, Dinheiro, Cartão, Mercado Pago).</p>
              </div>
            </div>
          </div>

          {/* Premiações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Prêmio 1º Lugar (Campeão)
              </label>
              <input
                type="text"
                value={formData.prize_1st}
                onChange={(e) => setFormData(p => ({ ...p, prize_1st: e.target.value }))}
                placeholder="Ex: R$ 300,00 + Troféu"
                className="w-full bg-[#050505] border border-amber-900/50 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Prêmio 2º Lugar (Vice)
              </label>
              <input
                type="text"
                value={formData.prize_2nd}
                onChange={(e) => setFormData(p => ({ ...p, prize_2nd: e.target.value }))}
                placeholder="Ex: R$ 100,00 + Medalha"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Prêmio 3º Lugar
              </label>
              <input
                type="text"
                value={formData.prize_3rd}
                onChange={(e) => setFormData(p => ({ ...p, prize_3rd: e.target.value }))}
                placeholder="Ex: R$ 50,00"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#39FF14] text-black font-black py-4 px-6 rounded-xl hover:brightness-110 disabled:opacity-50 transition cursor-pointer text-base shadow-lg flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>{loading ? 'Salvando...' : (editingTournament ? 'SALVAR ALTERAÇÕES DO CAMPEONATO' : 'CRIAR NOVO CAMPEONATO')}</span>
          </button>
        </form>
      </div>

      {/* Lista dos Campeonatos */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#39FF14]" />
          Campeonatos Cadastrados ({tournaments.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t, index) => {
            const feeDisplay = t.entry_fee || 'R$ 20,00';
            const methodsDisplay = t.payment_methods || t.payment_info || 'PIX, Dinheiro, Cartão';

            return (
              <div
                key={`${t.id}-${index}`}
                className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-[#39FF14]/50 transition-all flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-black text-lg text-white leading-tight">{t.name}</h4>
                    <span className="text-[10px] bg-green-950 text-green-300 border border-green-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                      {t.status}
                    </span>
                  </div>

                  <p className="text-[#39FF14] text-xs font-bold flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" /> {t.game || 'E-Sports'} • {t.platform || 'Multi-Plataforma'}
                  </p>

                  <div className="bg-[#050505] p-3 rounded-xl border border-gray-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Taxa de Inscrição:</span>
                      <span className="font-black text-[#39FF14] text-sm">{feeDisplay}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-gray-800/60">
                      <span className="text-gray-400">Formas de Pagamento:</span>
                      <span className="font-bold text-gray-200 text-right truncate max-w-[150px]" title={methodsDisplay}>
                        {methodsDisplay}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-gray-800/60">
                      <span className="text-gray-400">Vagas Totais:</span>
                      <span className="font-bold text-white">
                        {t.max_spots > 0 ? `${t.max_spots - t.current_spots} restantes / ${t.max_spots}` : 'Ilimitadas'}
                      </span>
                    </div>
                  </div>

                  {(t.prize_1st || t.prize_2nd || t.prize_3rd) && (
                    <div className="text-xs space-y-1 text-gray-300 bg-[#161616] p-2.5 rounded-lg border border-gray-800">
                      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Premiações Cadastradas:</p>
                      {t.prize_1st && <p>🥇 1º: <strong className="text-white">{t.prize_1st}</strong></p>}
                      {t.prize_2nd && <p>🥈 2º: <span className="text-gray-400">{t.prize_2nd}</span></p>}
                      {t.prize_3rd && <p>🥉 3º: <span className="text-gray-400">{t.prize_3rd}</span></p>}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-800">
                  <button
                    onClick={() => startEdit(t)}
                    className="flex-1 bg-[#39FF14]/10 text-[#39FF14] hover:bg-[#39FF14]/20 py-2.5 rounded-xl text-xs font-bold border border-[#39FF14]/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> EDITAR
                  </button>
                  <button
                    onClick={() => deleteTournament(t.id)}
                    className="bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/60 p-2.5 rounded-xl text-xs transition cursor-pointer"
                    title="Excluir Campeonato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {tournaments.length === 0 && (
            <div className="col-span-full p-8 bg-[#111] border border-gray-800 rounded-2xl text-center text-gray-500 italic">
              Nenhum campeonato cadastrado ainda. Preencha o formulário acima para criar o primeiro!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

