import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament, Ranking, Match, Penalty, Category } from '../lib/types';
import { Trophy, Medal, Award, Swords, TrendingUp, Target, ShieldCheck, User, UserCheck, Send, CheckCircle2, MessageCircle, Calendar, Clock, ShieldAlert, AlertTriangle, Gamepad2 } from 'lucide-react';
import { fetchCategories } from '../lib/categories';

interface RankingWithPlayer extends Ranking {
  players: { nickname: string };
}

export default function PublicView({ onGoToAdmin }: { onGoToAdmin: () => void }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<RankingWithPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedPublicCategory, setSelectedPublicCategory] = useState<string>('eFootball');
  const [nickname, setNickname] = useState('');
  const [platform, setPlatform] = useState('');
  const [copied, setCopied] = useState(false);

  const [pixKey, setPixKey] = useState('pix@cyberplay.com');
  const [pixName, setPixName] = useState('Cyberplay Torneios');
  const [defaultFee, setDefaultFee] = useState('R$ 20,00');
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState('PIX (Instantâneo), Dinheiro no Local, Cartão');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [pixInstructions, setPixInstructions] = useState('Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.');

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixKey)}`;
  const whatsappQrUrl = whatsappNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getWhatsAppLink())}`
    : '';

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [lastRegisteredNick, setLastRegisteredNick] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sponsors, setSponsors] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    loadSettings();

    const channel = supabase.channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
        loadSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setPixKey(data.pixKey || 'pix@cyberplay.com');
      setPixName(data.pixName || 'Cyberplay Torneios');
      setDefaultFee(data.defaultFee || 'R$ 20,00');
      setAcceptedPaymentMethods(data.acceptedPaymentMethods || 'PIX (Instantâneo), Dinheiro no Local, Cartão');
      setWhatsappNumber(data.whatsappNumber || '');
      setWhatsappGroupLink(data.whatsappGroupLink || '');
      setPixInstructions(data.pixInstructions || 'Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.');
      setSponsors(data.sponsors || []);
    }
  }

  

  function handleCopyPixKey() {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getWhatsAppLink(customNick?: string) {
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    if (!cleanPhone) return '#';
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const msg = customNick
      ? `Olá! Fiz minha inscrição no campeonato com o Nickname "${customNick}". Segue o comprovante de pagamento do PIX!`
      : `Olá! Fiz o pagamento do PIX para a inscrição no campeonato Cyber Play. Segue o comprovante!`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  }

  async function fetchData() {
    const cats = await fetchCategories();
    setAvailableCategories(cats);

    const { data: tData } = await supabase.from('tournaments').select('*');
    const { data: rData } = await supabase.from('rankings').select('*, players(nickname)');
    const { data: mData } = await supabase.from('matches').select('*');
    const { data: pnlData } = await supabase.from('penalties').select('*');
    setTournaments(tData || []);
    if (tData && tData.length > 0) {
      setSelectedTournamentId(tData[0].id);
    }
    setRankings((rData as any) || []);
    setMatches(mData || []);
    setPenalties((pnlData as any) || []);
  }

  async function handleDirectRegister(e: FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('Por favor, informe seu Nickname.');
      return;
    }

    setSubmitting(true);
    const tournamentIdToUse = selectedTournamentId || (tournaments[0]?.id || null);

    const submittedNick = nickname.trim();
    const { error } = await supabase.from('tournament_registrations').insert([{ 
      tournament_id: tournamentIdToUse, 
      nickname: submittedNick, 
      platform: platform || 'Não informada',
      phone: phone || null,
      status: 'Pendente'
    }]);

    setSubmitting(false);

    if (error) {
      console.error('Error registering:', error);
      alert('Erro ao enviar inscrição: ' + (error.message || JSON.stringify(error)));
    } else {
      setLastRegisteredNick(submittedNick);
      setRegisteredSuccess(true);
      setNickname('');
      setPlatform('');
      setPhone('');
      setNotes('');
    }
  }

  async function register(tournamentId: string) {
    if (!nickname.trim()) return;
    const { error } = await supabase.from('tournament_registrations').insert([{ 
      tournament_id: tournamentId, 
      nickname, 
      platform,
      status: 'Pendente'
    }]);
    if (error) console.error('Error registering:', error);
    else {
      
      setRegisteredSuccess(true);
      setTimeout(() => setRegisteredSuccess(false), 8000);
    }
  }

  const filteredRankings = rankings.filter(r => {
    if (selectedPublicCategory === 'Geral' || selectedPublicCategory === 'Todos') return true;
    const cat = r.game_category || 'Futebol';
    if (selectedPublicCategory === 'Futebol') {
      return cat === 'Futebol' || cat === 'eFootball' || cat.includes('EA FC') || cat.includes('FIFA');
    }
    return cat === selectedPublicCategory;
  });

  const sortedRankings = [...filteredRankings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const sgB = (b.goals_for || 0) - (b.goals_against || 0);
    const sgA = (a.goals_for || 0) - (a.goals_against || 0);
    if (sgB !== sgA) return sgB - sgA;
    return (b.wins || 0) - (a.wins || 0);
  });

  const top3 = sortedRankings.slice(0, 3);

  const filteredMatches = matches.filter(m => {
    if (selectedPublicCategory === 'Geral' || selectedPublicCategory === 'Todos') return true;
    const cat = m.game_category || 'Futebol';
    if (selectedPublicCategory === 'Futebol') {
      return cat === 'Futebol' || cat === 'eFootball' || cat.includes('EA FC') || cat.includes('FIFA');
    }
    return cat === selectedPublicCategory;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#39FF14] selection:text-black">
      <header className="border-b border-gray-800 p-6 flex justify-between items-center bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white tracking-wider">CYBER <span className="text-[#39FF14]">PLAY</span></h1>
          <span className="text-[10px] bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 px-2 py-0.5 rounded font-black tracking-widest uppercase">
            SISTEMA PARTICIPANTE
          </span>
        </div>
        <div className="flex items-center gap-4">
          {whatsappGroupLink && (
            <a 
              href={whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Entrar no Grupo</span>
            </a>
          )}
          <button onClick={onGoToAdmin} className="text-gray-400 hover:text-[#39FF14] text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer">
            <ShieldCheck className="w-4 h-4" /> <span className="hidden sm:inline">Area do Administrador</span>
          </button>
        </div>
      </header>
      
      <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-12">
        {/* PIX & WHATSAPP PAYMENT/CONTACT SECTION */}
        <section className="bg-gradient-to-r from-[#111] via-[#161616] to-[#111] border border-[#39FF14]/30 p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#39FF14]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full text-[#39FF14] text-xs font-bold uppercase tracking-wider">
                ⚡ Pagamento & Suporte Oficial
              </div>
              <h2 className="text-3xl font-black text-white">Pagamento PIX & Contato via WhatsApp</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {pixInstructions}
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Chave PIX Oficial</p>
                  <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                    <span className="font-mono text-lg font-bold text-[#39FF14] bg-[#050505] px-4 py-2 rounded-xl border border-gray-800 select-all">
                      {pixKey}
                    </span>
                    <button
                      onClick={handleCopyPixKey}
                      className="bg-[#39FF14] hover:brightness-110 text-black font-bold px-4 py-2 rounded-xl text-sm transition cursor-pointer flex items-center gap-2"
                    >
                      {copied ? '✓ Copiado!' : '📋 Copiar PIX'}
                    </button>
                  </div>
                  {pixName && (
                    <p className="text-xs text-gray-400 mt-1">
                      Beneficiário: <strong className="text-white">{pixName}</strong>
                    </p>
                  )}
                </div>

                {whatsappNumber && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center lg:justify-start">
                      <MessageCircle className="w-4 h-4 fill-emerald-950" /> WhatsApp do Organizador
                    </p>
                    <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                      <span className="font-mono text-base font-bold text-white bg-[#050505] px-3.5 py-1.5 rounded-lg border border-emerald-700/60">
                        {whatsappNumber}
                      </span>
                      <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#20bd5a] text-black font-black px-4 py-2 rounded-xl text-sm transition flex items-center gap-2 shadow-lg"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>Chamar no Zap</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR CODES CONTAINER */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code PIX */}
              <div className="flex flex-col items-center bg-[#050505] p-5 rounded-2xl border border-gray-800 shadow-xl space-y-2">
                <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-0.5 rounded">
                  QR CODE PIX
                </span>
                <img
                  src={qrCodeUrl}
                  alt="QR Code PIX para Pagamento"
                  className="w-40 h-40 bg-white p-2 rounded-xl border border-gray-700 object-contain shadow-inner"
                />
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Pagar Inscrição</p>
              </div>

              {/* QR Code WhatsApp */}
              {whatsappNumber && (
                <div className="flex flex-col items-center bg-[#050505] p-5 rounded-2xl border border-emerald-900/60 shadow-xl space-y-2">
                  <span className="text-[10px] font-black text-[#25D366] uppercase tracking-widest bg-[#25D366]/10 border border-[#25D366]/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 fill-current" /> QR CODE ZAP
                  </span>
                  <img
                    src={whatsappQrUrl}
                    alt="QR Code WhatsApp do Organizador"
                    className="w-40 h-40 bg-white p-2 rounded-xl border border-emerald-500/50 object-contain shadow-inner"
                  />
                  <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Escanear WhatsApp</p>
                </div>
              )}
              {/* QR Code Group */}
              {whatsappGroupLink && (
                <div className="flex flex-col items-center bg-[#050505] p-5 rounded-2xl border border-blue-900/60 shadow-xl space-y-2">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 fill-current" /> GRUPO ZAP
                  </span>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(whatsappGroupLink)}`}
                    alt="QR Code do Grupo"
                    className="w-40 h-40 bg-white p-2 rounded-xl border border-blue-500/50 object-contain shadow-inner"
                  />
                  <a href={whatsappGroupLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 font-bold uppercase tracking-wider hover:underline">
                    Entrar no Grupo
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ÁREA DE INSCRIÇÃO DOS PARTICIPANTES (FORMULÁRIO PRINCIPAL) */}
        <section className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full text-[#39FF14] text-xs font-bold uppercase tracking-wider mb-2">
                <UserCheck className="w-3.5 h-3.5" /> Portal de Participantes
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                Formulário de Inscrição no Campeonato
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Preencha seus dados para garantir sua vaga. Após realizar o pagamento via PIX acima, confirme sua inscrição abaixo.
              </p>
            </div>
            <span className="text-xs font-mono bg-[#050505] text-[#39FF14] px-3 py-1.5 rounded-lg border border border-gray-800 font-bold">
              ✓ Inscrição Instantânea
            </span>
          </div>

          {registeredSuccess && (
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-green-950 to-emerald-950 border-2 border-emerald-500 text-green-200 rounded-2xl space-y-4 animate-fade-in shadow-2xl">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-lg text-white">Inscrição Registrada com Sucesso!</p>
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    Sua vaga foi pré-reservada! Agora, envie o comprovante do PIX no WhatsApp do organizador para validar sua vaga imediatamente.
                  </p>
                </div>
              </div>

              {whatsappNumber && (
                <div className="pt-2 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={getWhatsAppLink(lastRegisteredNick)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-black font-black px-6 py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2.5 shadow-xl cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>ENVIAR COMPROVANTE AGORA PELO WHATSAPP ({whatsappNumber})</span>
                  </a>
                  <button
                    onClick={() => setRegisteredSuccess(false)}
                    className="text-xs text-emerald-400/80 hover:text-white underline cursor-pointer"
                  >
                    Fechar mensagem
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleDirectRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                1. Selecione o Torneio / Campeonato <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full bg-[#050505] border border-gray-700 p-3.5 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14] transition cursor-pointer"
              >
                {tournaments.length > 0 ? (
                  tournaments.map((t, index) => (
                    <option key={`${t.id}-${index}`} value={t.id}>
                      {t.name} ({t.max_spots - t.current_spots} vagas restantes — {t.payment_info})
                    </option>
                  ))
                ) : (
                  <option value="">Torneio Principal Cyber Play eFootball</option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                2. Seu Nickname / Gamer ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: PlayerPro_99 ou CyberKing"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-[#050505] border border-gray-700 p-3.5 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14] transition"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                3. Plataforma de Jogo
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#050505] border border-gray-700 p-3.5 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14] transition cursor-pointer"
              >
                <option value="">Selecione a plataforma...</option>
                <option value="PlayStation 5 (PS5)">PlayStation 5 (PS5)</option>
                <option value="PlayStation 4 (PS4)">PlayStation 4 (PS4)</option>
                <option value="Xbox Series X/S">Xbox Series X/S</option>
                <option value="Xbox One">Xbox One</option>
                <option value="PC / Steam">PC / Steam</option>
                <option value="Mobile (Android/iOS)">Mobile (Android/iOS)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                4. Telefone / WhatsApp para Contato
              </label>
              <input
                type="text"
                placeholder="Ex: (11) 99999-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#050505] border border-gray-700 p-3.5 rounded-xl text-white text-sm focus:outline-none focus:border-[#39FF14] transition"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#39FF14] hover:brightness-110 text-black font-black p-4 rounded-xl text-base transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>{submitting ? 'ENVIANDO INSCRIÇÃO...' : 'CONFIRMAR E ENVIAR INSCRIÇÃO AGORA'}</span>
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-2">
                * Ao enviar sua inscrição, confirme que realizou o pagamento do valor da taxa via PIX para a chave informada.
              </p>
            </div>
          </form>
        </section>

        {/* Campeonatos Ativos */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <Swords className="text-[#39FF14] w-7 h-7" /> Campeonatos Ativos
            </h2>
            <span className="text-xs text-gray-400 bg-[#111] px-3 py-1 rounded-full border border-gray-800">
              {tournaments.length} torneios disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t, index) => (
              <div key={`${t.id}-${index}`} className="p-6 bg-[#111] border border-gray-800 rounded-2xl space-y-4 hover:border-gray-600 transition shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-lg text-white">{t.name}</span>
                    <span className="text-[10px] bg-green-950 text-green-400 border border-green-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{t.status}</span>
                  </div>
                  <div className="text-sm text-gray-400 flex justify-between">
                    <span>Vagas Disponíveis:</span>
                    <span className="font-bold text-white">{t.max_spots > 0 ? `${t.max_spots - t.current_spots} / ${t.max_spots}` : 'Ilimitadas'}</span>
                  </div>
                  <div className="bg-[#050505] p-3 rounded-xl border border-gray-800 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Taxa de Inscrição:</span>
                      <span className="font-black text-[#39FF14] text-sm">{t.entry_fee || t.payment_info || defaultFee}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-800/60">
                      <span className="text-gray-400">Formas de Pagamento:</span>
                      <span className="font-bold text-gray-200 text-right truncate max-w-[140px]" title={t.payment_methods || acceptedPaymentMethods}>
                        {t.payment_methods || acceptedPaymentMethods}
                      </span>
                    </div>
                  </div>
                </div>

                
                <button
                  className="w-full bg-[#39FF14] text-black font-black p-3 rounded-xl text-sm hover:brightness-110 transition cursor-pointer mt-2"
                  onClick={() => {
                    setSelectedTournamentId(t.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Garantir Vaga
                </button>

              </div>
            ))}
          </div>
        </section>

        {/* TABELA DE CLASSIFICAÇÃO / RANKING POR CATEGORIA */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-800 pb-4">
            <div>
              <span className="text-xs font-bold text-[#39FF14] uppercase tracking-widest">Esports Leaderboard</span>
              <h2 className="text-3xl font-black text-white flex items-center gap-3 mt-1">
                <Trophy className="text-[#39FF14] w-8 h-8" /> Tabela de Classificação
              </h2>
            </div>

            {/* SELETOR DE CATEGORIA NO PUBLICVIEW */}
            <div className="flex flex-wrap items-center gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setSelectedPublicCategory(cat.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    selectedPublicCategory === cat.name
                      ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-md font-black'
                      : 'bg-[#111] text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  <span>{cat.icon || '🎮'}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedPublicCategory('Geral')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedPublicCategory === 'Geral' || selectedPublicCategory === 'Todos'
                    ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-md font-black'
                    : 'bg-[#111] text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                <span>🎮</span>
                <span>Todos</span>
              </button>
            </div>
          </div>

          {/* Destaque Top 3 Pódio */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* 2º Lugar */}
              {top3[1] && (
                <div className="bg-[#0e0e0e] border border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden order-2 md:order-1 transform hover:-translate-y-1 transition">
                  <div className="absolute top-0 right-0 bg-gray-400/20 text-gray-300 font-black text-xs px-3 py-1 rounded-bl-xl border-l border-b border-gray-600">
                    2º LUGAR
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 flex items-center justify-center text-black font-black text-2xl shadow-lg my-2">
                    🥈
                  </div>
                  <div className="space-y-1 my-2">
                    <h4 className="font-black text-lg text-white">{top3[1].nickname || top3[1].players?.nickname || 'Jogador'}</h4>
                    <p className="text-xs text-gray-400 font-mono">{top3[1].wins || 0} Vitórias</p>
                  </div>
                  <div className="w-full bg-[#161616] p-3 rounded-xl border border-gray-800 flex justify-around text-xs mt-3">
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase font-bold">Partidas</p>
                      <p className="font-bold text-white">{top3[1].matches_played || (top3[1].wins || 0) + (top3[1].losses || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase font-bold">Pontos</p>
                      <p className="font-black text-[#39FF14] text-sm">{top3[1].points} PTS</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1º Lugar */}
              {top3[0] && (
                <div className="bg-gradient-to-b from-[#182212] to-[#0e0e0e] border-2 border-[#39FF14] rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden order-1 md:order-2 shadow-2xl shadow-[#39FF14]/10 transform hover:-translate-y-2 transition">
                  <div className="absolute top-0 right-0 bg-[#39FF14] text-black font-black text-xs px-4 py-1.5 rounded-bl-xl shadow-md">
                    👑 LÍDER
                  </div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center text-black font-black text-3xl shadow-xl my-2 border-2 border-yellow-200">
                    🥇
                  </div>
                  <div className="space-y-1 my-2">
                    <h4 className="font-black text-xl text-white tracking-wide">{top3[0].nickname || top3[0].players?.nickname || 'Campeão'}</h4>
                    <p className="text-xs text-[#39FF14] font-mono font-bold">{top3[0].wins || 0} Vitórias Invicto</p>
                  </div>
                  <div className="w-full bg-[#050505] p-3 rounded-xl border border-[#39FF14]/30 flex justify-around text-xs mt-3">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Partidas</p>
                      <p className="font-bold text-white">{top3[0].matches_played || (top3[0].wins || 0) + (top3[0].losses || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Pontuação</p>
                      <p className="font-black text-[#39FF14] text-base">{top3[0].points} PTS</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3º Lugar */}
              {top3[2] && (
                <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden order-3 transform hover:-translate-y-1 transition">
                  <div className="absolute top-0 right-0 bg-amber-800/40 text-amber-400 font-black text-xs px-3 py-1 rounded-bl-xl border-l border-b border-amber-800">
                    3º LUGAR
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-white font-black text-2xl shadow-lg my-2">
                    🥉
                  </div>
                  <div className="space-y-1 my-2">
                    <h4 className="font-black text-lg text-white">{top3[2].nickname || top3[2].players?.nickname || 'Jogador'}</h4>
                    <p className="text-xs text-gray-400 font-mono">{top3[2].wins || 0} Vitórias</p>
                  </div>
                  <div className="w-full bg-[#161616] p-3 rounded-xl border border-gray-800 flex justify-around text-xs mt-3">
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase font-bold">Partidas</p>
                      <p className="font-bold text-white">{top3[2].matches_played || (top3[2].wins || 0) + (top3[2].losses || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase font-bold">Pontos</p>
                      <p className="font-black text-[#39FF14] text-sm">{top3[2].points} PTS</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabela Completa */}
          <div className="bg-[#0a0a0a] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#111] text-gray-400 uppercase font-black text-xs border-b border-gray-800 tracking-wider">
                  <tr>
                    <th className="p-4 w-16 text-center">POS</th>
                    <th className="p-4">JOGADOR / NICKNAME</th>
                    <th className="p-4 text-center">PJ</th>
                    <th className="p-4 text-center text-green-400">V</th>
                    <th className="p-4 text-center text-gray-400">E</th>
                    <th className="p-4 text-center text-red-400">D</th>
                    
                    {selectedPublicCategory === 'Futebol' ? (
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
                    const nick = r.nickname || r.players?.nickname || 'Jogador sem nome';

                    let posBadge = null;
                    if (pos === 1) posBadge = <span className="inline-block px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-black text-xs border border-yellow-500/40">🥇 1º</span>;
                    else if (pos === 2) posBadge = <span className="inline-block px-2 py-0.5 rounded bg-gray-400/20 text-gray-200 font-black text-xs border border-gray-400/40">🥈 2º</span>;
                    else if (pos === 3) posBadge = <span className="inline-block px-2 py-0.5 rounded bg-amber-700/20 text-amber-400 font-black text-xs border border-amber-700/40">🥉 3º</span>;
                    else posBadge = <span className="font-black text-gray-500 text-sm">#{pos}</span>;

                    return (
                      <tr 
                        key={`${r.id}-${index}`} 
                        className={`hover:bg-[#121212] transition ${pos <= 3 ? 'bg-[#39FF14]/[0.02]' : ''}`}
                      >
                        <td className="p-4 text-center">{posBadge}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-gray-300 text-xs uppercase">
                              {nick[0]}
                            </div>
                            <span className="font-bold text-white text-base">{nick}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-300">{pj}</td>
                        <td className="p-4 text-center font-bold text-green-400 bg-green-950/20">{wins}</td>
                        <td className="p-4 text-center font-bold text-gray-400">{draws}</td>
                        <td className="p-4 text-center font-bold text-red-400 bg-red-950/20">{losses}</td>
                        
                        {selectedPublicCategory === 'Futebol' ? (
                          <>
                            <td className="p-4 text-center font-bold text-blue-400">{gf}</td>
                            <td className="p-4 text-center font-bold text-amber-400">{ga}</td>
                            <td className="p-4 text-center font-black text-[#39FF14]">{sg > 0 ? `+${sg}` : sg}</td>
                          </>
                        ) : (
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-800 rounded-full h-2 overflow-hidden hidden sm:block">
                                <div className="bg-[#39FF14] h-full rounded-full" style={{ width: `${winRate}%` }}></div>
                              </div>
                              <span className="font-bold text-xs font-mono text-gray-300">{winRate}%</span>
                            </div>
                          </td>
                        )}

                        <td className="p-4 text-right pr-6 font-black text-lg text-[#39FF14] font-mono">
                          {r.points} <span className="text-xs text-gray-500 font-normal">PTS</span>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedRankings.length === 0 && (
                    <tr>
                      <td colSpan={selectedPublicCategory === 'Futebol' ? 10 : 8} className="p-8 text-center text-gray-500 italic">
                        Nenhum jogador classificado nesta categoria no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Punições e Advertências Disciplinares */}
        {penalties.length > 0 && (
          <section className="p-6 bg-red-950/20 border border-red-900/60 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-black text-lg">
              <ShieldAlert className="w-6 h-6" />
              <span>Painel de Punições e Disciplina ({selectedPublicCategory})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {penalties
                .filter(p => selectedPublicCategory === 'Geral' || !p.game_category || p.game_category === selectedPublicCategory || selectedPublicCategory === 'Todos')
                .map((p, idx) => (
                  <div key={`${p.id}-${idx}`} className="p-3.5 bg-[#080808] border border-red-900/40 rounded-xl flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{p.player_nickname}</span>
                        <span className="text-[10px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded font-mono font-bold">
                          -{p.points_deducted} PTS
                        </span>
                      </div>
                      <p className="text-gray-400">{p.reason}</p>
                      {p.created_at && (
                        <p className="text-[10px] text-gray-500 font-mono">
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Chaveamentos de Partidas */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <Target className="text-[#39FF14] w-7 h-7" /> Chaveamentos e Agenda de Partidas ({selectedPublicCategory})
            </h2>
            <span className="text-xs text-gray-400 bg-[#111] px-3 py-1 rounded-full border border-gray-800 font-mono">
              {filteredMatches.length} confrontos registrados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMatches.map((m, index) => {
              const isFinished = m.status === 'Concluído' || m.status === 'Finalizado';
              const isScheduled = m.status === 'Agendado';
              const isLive = m.status === 'Em Andamento';

              return (
                <div key={`${m.id}-${index}`} className="p-6 bg-[#111] border border-gray-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-md hover:border-gray-700 transition relative overflow-hidden">
                  {/* Phase & Status Header */}
                  <div className="flex justify-between items-center text-xs border-b border-gray-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#39FF14] uppercase tracking-wider">{m.game_category || 'Geral'}</span>
                      {m.phase && (
                        <span className="text-[11px] bg-gray-900 text-gray-300 px-2 py-0.5 rounded font-medium border border-gray-800">
                          {m.phase}
                        </span>
                      )}
                    </div>
                    
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isLive ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse' :
                      isFinished ? 'bg-green-950 text-green-400 border-green-800' :
                      'bg-gray-900 text-gray-400 border-gray-800'
                    }`}>
                      {m.status}
                    </span>
                  </div>

                  {/* Date & Time if scheduled */}
                  {(m.match_date || m.match_time) && (
                    <div className="flex items-center gap-3 text-xs text-gray-400 bg-[#080808] p-2.5 rounded-xl border border-gray-850">
                      {m.match_date && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#39FF14]" />
                          <span>{m.match_date}</span>
                        </div>
                      )}
                      {m.match_time && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{m.match_time}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Players & Score */}
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <User className={`w-4 h-4 shrink-0 ${m.winner === m.player1 ? 'text-[#39FF14]' : 'text-gray-500'}`} />
                      <span className={`font-bold text-base truncate ${m.winner === m.player1 ? 'text-[#39FF14]' : 'text-white'}`}>
                        {m.player1}
                      </span>
                    </div>

                    <div className="px-4 py-2 bg-[#050505] rounded-xl border border-gray-800 text-center shadow-inner mx-2 shrink-0">
                      <span className="text-[#39FF14] font-black text-xl font-mono">{m.score1} x {m.score2}</span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                      <span className={`font-bold text-base truncate text-right ${m.winner === m.player2 ? 'text-[#39FF14]' : 'text-white'}`}>
                        {m.player2}
                      </span>
                      <User className={`w-4 h-4 shrink-0 ${m.winner === m.player2 ? 'text-[#39FF14]' : 'text-gray-500'}`} />
                    </div>
                  </div>

                  {/* Winner / Loser / Details */}
                  {m.winner && m.winner !== 'Empate' && (
                    <div className="pt-2 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full text-[#39FF14] font-black">
                        🏆 Vencedor: {m.winner}
                      </span>
                      {m.loser && (
                        <span className="text-gray-500 font-medium">
                          Derrotado: <span className="text-gray-300 font-bold">{m.loser}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {m.winner === 'Empate' && (
                    <div className="pt-2 border-t border-gray-800/60 text-center">
                      <span className="text-xs text-gray-400 font-bold">🤝 Partida Empatada</span>
                    </div>
                  )}

                  {/* Match Punishment / Notes */}
                  {m.punishment && (
                    <div className="p-2.5 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{m.punishment}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredMatches.length === 0 && (
              <div className="col-span-2 p-8 bg-[#111] border border-gray-800 rounded-2xl text-center text-gray-500 italic">
                Nenhum chaveamento cadastrado para esta categoria ainda.
              </div>
            )}
          </div>
        </section>

        {/* Seção de Patrocinadores & Apoio Oficial */}
        <section className="space-y-6 pt-8 border-t border-gray-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <Award className="text-[#39FF14] w-7 h-7" /> PATROCINADORES & APOIO OFICIAL
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Marcas e parceiros que apoiam e tornam este campeonato possível
              </p>
            </div>
            <span className="text-[10px] bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider self-start sm:self-auto">
              ★ PARCEIROS DO TORNEIO
            </span>
          </div>

          {sponsors.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sponsors.map((sp: any, index) => (
                <a
                  key={`${sp.id}-${index}`}
                  href={sp.website || '#'}
                  target={sp.website ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="group p-5 bg-[#0a0a0a] border border-gray-800/80 hover:border-[#39FF14]/60 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 transition duration-300 hover:shadow-[0_0_20px_rgba(57,255,20,0.15)] transform hover:-translate-y-1"
                >
                  {sp.logoUrl ? (
                    <img src={sp.logoUrl} alt={sp.name} className="h-12 w-auto object-contain max-w-full filter group-hover:brightness-110 transition" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-[#39FF14]/30 text-[#39FF14] font-black text-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                      {sp.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-[#39FF14] transition">{sp.name}</h4>
                    <span className="inline-block mt-1 text-[10px] uppercase font-mono font-bold text-gray-400 bg-gray-900 border border-gray-800 px-2.5 py-0.5 rounded-md">
                      {sp.category || 'Patrocinador'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-[#0a0a0a] border border-gray-800 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 text-gray-500 mx-auto flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Espaço para Patrocinadores</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Cadastre seus patrocinadores no painel de administração em Configurações &gt; Patrocinadores para exibi-los aqui.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Rodapé da Tela Inicial */}
        <footer className="pt-8 pb-4 text-center border-t border-gray-900 text-xs text-gray-600 space-y-2">
          <p className="font-bold tracking-wider uppercase text-gray-500">© 2026 CYBER PLAY • TORNEIOS DE E-SPORTS & FOOTBALL</p>
          <p className="text-[11px] text-gray-400">
            Desenvolvido por <span className="text-[#39FF14] font-black tracking-wider uppercase">MAGNO THIAGO CYBER GHOST</span>
          </p>
          <p className="text-[10px] text-gray-600">Sistema de Gestão Esportiva em Tempo Real</p>
        </footer>
      </main>
    </div>
  );
}
